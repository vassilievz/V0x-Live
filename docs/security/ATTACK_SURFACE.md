# Superfície de ataque

## Público (sem sessão)

| Endpoint | Dados expostos |
|----------|----------------|
| `GET /health`, `/ready` | Status |
| `GET /api/v1/rooms` | Salas **públicas** ativas |
| `GET /api/v1/rooms/{id}/preview` | Metadados só se **public** |
| `GET /api/v1/auth/google` | Redirect OAuth |

## Autenticado (cookie)

| Área | Rotas | Notas |
|------|-------|-------|
| Auth | `/auth/guest`, `/auth/me`, `/auth/logout` | Guest 24h DB; cookie 7d |
| Salas | join, participants, chat, music, livekit-token | Exige participante ativo |
| WS | `/api/v1/realtime/ws?room_id=` | Origin allowlist; sessão + sala |

## LiveKit

- Token: `POST .../livekit-token` após join
- Webhooks LiveKit na API: **não implementados**

## Infra (dev)

- `docker-compose.yml`: Redis `6379`, LiveKit `7880-7882`, modo `--dev`
- Secrets default em `config.go` — **proibido em produção**

## Frontend

- Sem `dangerouslySetInnerHTML` em `apps/web/src`
- `localStorage`: locale, preferências broadcast (não auth)

Detalhes API: [API_SECURITY.md](./API_SECURITY.md). WebSocket: [WEBSOCKET_SECURITY.md](./WEBSOCKET_SECURITY.md). WebRTC: [WEBRTC_LIVEKIT_SECURITY.md](./WEBRTC_LIVEKIT_SECURITY.md).
