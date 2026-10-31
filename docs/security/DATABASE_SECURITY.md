# Banco de dados

Persistência: **MongoDB** (`MONGO_URL`), driver oficial, filtros BSON estruturados (sem SQL).

- Índices/TTL: `internal/database/store.go`
- Senhas sala: hash Argon2, nunca plaintext
- Sessões: `token_hash` único, `expires_at` TTL

Redis: apenas stack LiveKit (Docker), não acessado pela API Go.
