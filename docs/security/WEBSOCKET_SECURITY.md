# WebSocket

- Rota: `GET /api/v1/realtime/ws?room_id=`
- Auth: cookie + `EnsureActiveParticipant`
- Origin: allowlist CORS; vazio negado em produção
- Cliente: mensagens do browser **descartadas** (`realtime/client.go`); só server push
- Tamanho máximo leitura: 4 KiB

Limitação: hub in-memory — ver [RESIDUAL_RISKS.md](./RESIDUAL_RISKS.md).
