# Decisões arquiteturais — V0x Live

## ADR-005 (atualizado): MongoDB

**Decisão:** Persistência principal em **MongoDB** via official driver. Índices garantidos no startup (`EnsureIndexes`).

**Coleções:** `users`, `user_sessions`, `rooms`, `room_participants`, `chat_messages`.

**Consequências:** Sem Goose/sqlc/PostgreSQL. TTL em `user_sessions.expires_at`.

## ADR-006 (revogado): sqlc + goose

Substituído por repositórios Go diretos sobre MongoDB.

## Configuração mínima

Apenas `MONGO_URL` em `apps/api/.env` é obrigatório para desenvolvimento.

## LiveKit vs WebSocket

Inalterado (ADR-003): mídia no LiveKit; eventos de app no WebSocket (a implementar).

## Redis

Opcional: LiveKit local no Docker usa Redis. A API não exige Redis até fan-out WebSocket.
