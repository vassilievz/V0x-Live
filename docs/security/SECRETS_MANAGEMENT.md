# Segredos

| Variável | Onde |
|----------|------|
| `MONGO_URL` | API |
| `GOOGLE_CLIENT_SECRET` | API |
| `LIVEKIT_API_SECRET` | API |
| `SESSION` | implícito via random token |

Nunca commitar `apps/api/.env`. Templates: `apps/api/.env.example`.

Se vazamento: rotacionar no provedor, revogar sessões (`RevokeAllForUser`), atualizar deploy.
