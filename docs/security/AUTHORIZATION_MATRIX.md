# Matriz de autorização (backend)

| Operação | Guest | Participant | Moderator | Host |
|----------|-------|-------------|-----------|------|
| Entrar sala **pública** (POST join) | Sim | Sim | Sim | Sim |
| Entrar sala **privada** (POST join por ID) | **Não** | **Não** | **Não** | **Não** |
| Entrar sala privada (POST join-by-code) | Sim | Sim | Sim | Sim |
| Preview sala privada | **404** | **404** | **404** | **404** |
| Chat | Se na sala e não muted | Sim | Sim | Sim |
| LiveKit publish | Se `can_publish && !muted` | Idem | Idem | Sim |
| Remover participante | Não | Não | Sim* | Sim |
| Patch permissions | Não | Não | Não | Sim |
| Fechar sala | Não | Não | Não | Sim |
| Ver `invite_code` (GET room) | Não | Não | Não | Sim |

\* Moderator: `RemoveParticipant` em `rooms/service.go`.

Enforcement: `apps/api/internal/rooms/service.go`, handlers em `rooms/handler.go`, `streaming/handler.go`, `chat/handler.go`.
