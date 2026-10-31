# Infraestrutura

- `docker-compose.yml`: Redis + LiveKit dev — **não** expor em produção.
- `infrastructure/nginx/web.conf`: CSP, headers, proxy API + WebSocket upgrade.
- `TRUST_PROXY=true` somente atrás de nginx/load balancer confiável.

Checklist produção: TLS termination, `APP_ENV=production`, secrets fortes, MongoDB auth + rede privada.
