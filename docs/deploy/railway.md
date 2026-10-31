# Deploy na Railway

Monorepo com **dois serviços** (recomendado) + MongoDB Atlas + LiveKit externo.

## 1. API (Go)

| Campo | Valor |
|--------|--------|
| **Root Directory** | `/` (raiz do repo) |
| **Dockerfile** | `apps/api/Dockerfile` |
| **Healthcheck** | `GET /health` |

Variáveis (ver `apps/api/.env.example`):

- `MONGO_URL` — obrigatório (Atlas ou Railway Mongo plugin)
- `APP_ENV=production`
- `TRUST_PROXY=true`
- `CORS_ALLOWED_ORIGINS` — URL pública do frontend
- `APP_URL` — URL pública do frontend (links/cookies)
- `LIVEKIT_*` — servidor LiveKit acessível pela internet

Porta: Railway injeta `PORT`; se necessário, mapeie `HTTP_ADDR=:${PORT}` (ou use `:8080` se a imagem expõe 8080 e você fixar `PORT=8080`).

## 2. Web (Vite + nginx)

| Campo | Valor |
|--------|--------|
| **Dockerfile** | `infrastructure/docker/Dockerfile.web` |

**Build Args** (obrigatórios em produção):

- `VITE_API_URL` — URL HTTPS da API
- `VITE_LIVEKIT_URL` — `wss://...` do LiveKit

Opcional: `VITE_WS_URL` se WebSocket não for derivado da API.

Gere domínio público no serviço web. Atualize `CORS_ALLOWED_ORIGINS` e `APP_URL` na API com essa URL.

## 3. LiveKit

Use [LiveKit Cloud](https://livekit.io/) ou self-host. Redis é exigido pelo LiveKit em produção (`docker-compose.yml` local é só dev).

## 4. Checklist pós-deploy

1. API responde `/health` e `/ready`
2. Frontend carrega; login guest funciona (cookies `Secure` em HTTPS)
3. Entrar numa sala e obter token LiveKit
4. CORS sem erro no browser

Docs: [Railway Docs](https://docs.railway.com/)
