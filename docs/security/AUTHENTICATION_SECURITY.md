# Autenticação

- Sessão: cookie HttpOnly `v0x_session`, token 32 bytes, hash SHA-256 em `user_sessions`.
- Guest: `POST /auth/guest`, TTL 24h no MongoDB.
- Google OAuth: state cookie, e-mail verificado, redirect relativo via `safeRelativePath`.
- Logout: revoga sessão no MongoDB.

Senhas de **sala** (não conta): Argon2id em `auth/password`.

Ver `apps/api/internal/auth/` e [VULNERABILITY_REPORT.md](./VULNERABILITY_REPORT.md) VOX-003, VOX-010.
