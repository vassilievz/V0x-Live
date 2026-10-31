# Infraestrutura

- `docker-compose.yml`: Redis + LiveKit dev — **não** expor em produção.
- `infrastructure/nginx/web.conf`: CSP, headers, proxy API + WebSocket upgrade.
- **Watch party (`.mp4` / `.m3u8`):** CSP já inclui `media-src 'self' https: blob:` e `connect-src 'self' https: wss:` — CDNs HTTPS e segmentos HLS são permitidos no browser; playback direto usa **`GET /api/v1/rooms/{id}/music/stream`** (proxy same-origin, só URLs já gravadas na sala e mesmo host CDN) para contornar CORS do CDN; o Go não aceita URL arbitrária no proxy.
- `TRUST_PROXY=true` somente atrás de nginx/load balancer confiável.

Checklist produção: TLS termination, `APP_ENV=production`, secrets fortes, MongoDB auth + rede privada.
