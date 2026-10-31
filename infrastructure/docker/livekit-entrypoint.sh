#!/bin/sh
set -eu

echo "=== V0X LIVEKIT (livekit-server) ==="

host="${REDISHOST:-}"
port="${REDISPORT:-6379}"
user="${REDISUSER:-}"
pass="${REDIS_PASSWORD:-${REDISPASSWORD:-}}"

# REDIS_URL=redis://default:password@host:6379 (Railway)
if [ -n "${REDIS_URL:-}" ]; then
  rest="${REDIS_URL#redis://}"
  case "$rest" in
    *@*)
      userpass="${rest%%@*}"
      hostport="${rest#*@}"
      [ -z "$user" ] && user="${userpass%%:*}"
      [ -z "$pass" ] && pass="${userpass#*:}"
      [ -z "$host" ] && host="${hostport%%:*}"
      [ -z "$port" ] || [ "$port" = "6379" ] && port="${hostport#*:}"
      ;;
    *)
      [ -z "$host" ] && host="${rest%%:*}"
      [ -z "$port" ] || [ "$port" = "6379" ] && port="${rest#*:}"
      ;;
  esac
fi

[ -z "$user" ] && user="default"
[ -z "$port" ] && port=6379

if [ -z "$host" ]; then
  echo "Defina REDIS_URL (referência ao plugin Redis) ou REDISHOST." >&2
  exit 1
fi

if [ -z "$pass" ]; then
  echo "Redis exige password (NOAUTH). Use REDIS_URL completo ou REDIS_PASSWORD do plugin." >&2
  exit 1
fi

listen="${PORT:-7880}"

# Evitar que caracteres especiais na password quebrem o YAML (Railway usa alfanumérico)
cat > /tmp/livekit.yaml <<EOF
port: ${listen}
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
redis:
  address: ${host}:${port}
  username: ${user}
  password: "${pass}"
logging:
  level: info
EOF

echo "livekit redis target: ${user}@${host}:${port}"

exec /livekit-server --config /tmp/livekit.yaml
