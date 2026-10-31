#!/bin/sh
set -eu

echo "=== V0X LIVEKIT (livekit-server) — se vês nginx, o Dockerfile path está errado no serviço Railway ==="

host="${REDISHOST:-}"
port="${REDISPORT:-6379}"
user="${REDISUSER:-default}"
pass="${REDIS_PASSWORD:-${REDISPASSWORD:-}}"

if [ -z "$host" ] && [ -n "${REDIS_URL:-}" ]; then
  # redis://user:pass@host:port
  host="$(printf '%s' "$REDIS_URL" | sed -n 's|^redis://[^@]*@\([^:/]*\).*|\1|p')"
  port="$(printf '%s' "$REDIS_URL" | sed -n 's|^redis://[^@]*@[^:]*:\([0-9]*\).*|\1|p')"
  [ -z "$port" ] && port=6379
fi

if [ -z "$host" ]; then
  echo "Defina REDIS_URL ou REDISHOST (referência ao plugin Redis na Railway)." >&2
  exit 1
fi

listen="${PORT:-7880}"

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
  password: ${pass}
logging:
  level: info
EOF

exec livekit-server --config /tmp/livekit.yaml --bind "0.0.0.0"
