#!/bin/sh
# LiveKit on Railway: no inbound UDP — media must use ICE/TCP via a TCP proxy on 7881.
set -eu

log() { printf '=== V0X LIVEKIT === %s\n' "$*" >&2; }
yesc() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

wait_for_tcp_listen() {
  _port="$1"
  _attempt=0
  while [ "$_attempt" -lt 40 ]; do
    if ss -ltn 2>/dev/null | grep -q ":${_port} "; then
      return 0
    fi
    _attempt=$((_attempt + 1))
    sleep 0.25
  done
  return 1
}

apply_railway_rtc_env() {
  # LiveKit merges LIVEKIT_* env over the YAML file; Railway may set tcp_port to 7881.
  export LIVEKIT_RTC_TCP_PORT="$ICE_TCP_PORT"
  export LIVEKIT_RTC_FORCE_TCP="true"
  export LIVEKIT_RTC_USE_EXTERNAL_IP="false"
  export LIVEKIT_RTC_NODE_IP="$NODE_IP"
}

host="${REDISHOST:-}"
port="${REDISPORT:-6379}"
user="${REDISUSER:-}"
pass="${REDIS_PASSWORD:-${REDISPASSWORD:-}}"

redis_url="${REDIS_URL:-${REDIS_PRIVATE_URL:-${REDIS_PUBLIC_URL:-}}}"

if [ -n "$redis_url" ]; then
  rest="${redis_url#redis://}"
  case "$rest" in
    *@*)
      userpass="${rest%%@*}"
      hostport="${rest#*@}"
      [ -z "$user" ] && user="${userpass%%:*}"
      [ -z "$pass" ] && pass="${userpass#*:}"
      [ -z "$host" ] && host="${hostport%%:*}"
      if [ -z "$port" ] || [ "$port" = "6379" ]; then
        hp="${hostport#*:}"
        [ -n "$hp" ] && port="$hp"
      fi
      ;;
    *)
      [ -z "$host" ] && host="${rest%%:*}"
      if [ -z "$port" ] || [ "$port" = "6379" ]; then
        hp="${rest#*:}"
        [ -n "$hp" ] && port="$hp"
      fi
      ;;
  esac
fi

[ -z "$user" ] && user="default"
[ -z "$port" ] && port=6379

if [ -z "$host" ]; then
  log "Redis não configurado. No serviço LiveKit: REDIS_URL = Reference → plugin Redis."
  exit 1
fi

if [ -z "$pass" ]; then
  log "Redis exige password (REDIS_URL completo ou REDIS_PASSWORD)."
  exit 1
fi

CONFIG="/tmp/livekit.yaml"

ICE_TCP_PORT=""
NODE_IP=""
BRIDGE_FROM="7881"

if [ -n "${RAILWAY_TCP_PROXY_DOMAIN:-}" ] && [ -n "${RAILWAY_TCP_PROXY_PORT:-}" ]; then
  ICE_TCP_PORT="$RAILWAY_TCP_PROXY_PORT"
  NODE_IP="${LIVEKIT_NODE_IP:-}"
  if [ -z "$NODE_IP" ]; then
    NODE_IP=$(dig +short +timeout=3 A "$RAILWAY_TCP_PROXY_DOMAIN" 2>/dev/null \
      | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)
  fi
  if [ -z "$NODE_IP" ]; then
    NODE_IP=$(getent ahostsv4 "$RAILWAY_TCP_PROXY_DOMAIN" 2>/dev/null | awk 'NR==1 {print $1}')
  fi
  if [ -z "$NODE_IP" ]; then
    log "FATAL: não resolveu $RAILWAY_TCP_PROXY_DOMAIN — defina LIVEKIT_NODE_IP."
    exit 1
  fi
  BRIDGE_FROM="${RAILWAY_TCP_APPLICATION_PORT:-7881}"
  log "ICE/TCP: ${NODE_IP}:${ICE_TCP_PORT} (${RAILWAY_TCP_PROXY_DOMAIN})"
else
  log "AVISO: sem TCP proxy Railway na porta 7881 — WebRTC UDP falha aqui; crie o proxy e redeploy."
fi

# Railway HTTP/WSS (domínio lklive). Com TCP proxy na 7881, a Railway injeta PORT=7881 no container.
_http_from_env="${LIVEKIT_HTTP_PORT:-${PORT:-7880}}"
listen="$_http_from_env"
if [ -n "$ICE_TCP_PORT" ] && [ "$listen" = "$BRIDGE_FROM" ]; then
  listen="8080"
  log "AVISO: container PORT=${_http_from_env} (TCP proxy); HTTP/WSS usa ${listen}."
  log "AVISO: adicione variable PORT=8080 neste serviço (sobrescreve a Railway)."
fi
log "HTTP/WSS (signalling) port: ${listen}"

if [ -n "$ICE_TCP_PORT" ]; then
  RTC_BLOCK=$(printf '%s\n' \
    "  tcp_port: ${ICE_TCP_PORT}" \
    "  force_tcp: true" \
    "  use_external_ip: false" \
    "  node_ip: \"$(yesc "$NODE_IP")\"")
else
  RTC_BLOCK=$(printf '%s\n' \
    "  tcp_port: 7881" \
    "  port_range_start: 50000" \
    "  port_range_end: 60000" \
    "  use_external_ip: true")
fi

KEYS_BLOCK=""
if [ -n "${LIVEKIT_API_KEY:-}" ] && [ -n "${LIVEKIT_API_SECRET:-}" ]; then
  KEYS_BLOCK="keys:
  \"$(yesc "$LIVEKIT_API_KEY")\": \"$(yesc "$LIVEKIT_API_SECRET")\""
fi

{
  echo "port: ${listen}"
  [ -n "$KEYS_BLOCK" ] && echo "$KEYS_BLOCK"
  echo "rtc:"
  echo "$RTC_BLOCK"
  echo "turn:"
  echo "  enabled: false"
  echo "redis:"
  echo "  address: ${host}:${port}"
  echo "  username: \"$(yesc "$user")\""
  echo "  password: \"$(yesc "$pass")\""
  echo "logging:"
  echo "  level: ${LIVEKIT_LOG_LEVEL:-info}"
} > "$CONFIG"

log "redis target: ${user}@${host}:${port}"

if [ -n "$ICE_TCP_PORT" ]; then
  apply_railway_rtc_env
  log "LIVEKIT_RTC_TCP_PORT=${LIVEKIT_RTC_TCP_PORT} (proxy público; container :${BRIDGE_FROM:-7881} via socat)"
fi

if [ -n "$BRIDGE_FROM" ] && [ "$BRIDGE_FROM" != "$ICE_TCP_PORT" ]; then
  BRIDGE_TO="${LIVEKIT_BRIDGE_TARGET_IP:-}"
  if [ -z "$BRIDGE_TO" ]; then
    BRIDGE_TO=$(ip -4 -o addr show scope global 2>/dev/null \
      | awk '{print $4}' | cut -d/ -f1 | head -n 1)
  fi
  if [ -z "$BRIDGE_TO" ]; then
    BRIDGE_TO=$(hostname -i 2>/dev/null | tr ' ' '\n' \
      | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | grep -v '^127\.' | head -n 1)
  fi
  if [ -z "$BRIDGE_TO" ]; then
    log "FATAL: IP do container para bridge ICE/TCP — defina LIVEKIT_BRIDGE_TARGET_IP."
    exit 1
  fi

  # LiveKit must bind the public proxy port first; socat owns :7881 for Railway ingress.
  /livekit-server --config "$CONFIG" &
  LKPID=$!
  if ! wait_for_tcp_listen "$ICE_TCP_PORT"; then
    log "FATAL: LiveKit não abriu TCP :${ICE_TCP_PORT}. Verifique LIVEKIT_RTC_TCP_PORT no serviço (deve ser ${ICE_TCP_PORT}, não ${BRIDGE_FROM})."
    kill "$LKPID" 2>/dev/null || true
    wait "$LKPID" 2>/dev/null || true
    exit 1
  fi

  log "bridge :${BRIDGE_FROM} -> ${BRIDGE_TO}:${ICE_TCP_PORT}"
  socat TCP-LISTEN:"$BRIDGE_FROM",fork,reuseaddr \
    TCP:"$BRIDGE_TO":"$ICE_TCP_PORT",retry=5,interval=1 &

  exec tini -s -- sh -c "wait $LKPID"
fi

exec tini -s -- /livekit-server --config "$CONFIG"
