# Deploy na Railway (V0x Live)

Produção: **`live.v0x.lol`** (web) · **`apilive.v0x.lol`** (API) · **`lklive.v0x.lol`** (LiveKit).  
Valores prontos para colar: **`.env.railway`** (gitignored). Detalhe DNS: [`domains.md`](domains.md).

**Erro Railpack / deploy errado?** → [`railway-services.md`](railway-services.md) (3 serviços Git + Redis plugin; **sem** `railway.toml` na raiz).

## Ordem recomendada

1. Criar **project** Railway + ligar o repo GitHub (deploy automático).
2. Adicionar plugin **Redis**.
3. Criar **4 serviços** (ou 3 + Redis plugin):

| Serviço | `railway.toml` / Dockerfile | Domínio custom |
|--------|-----------------------------|----------------|
| **API** | `apps/api/railway.toml` → `apps/api/Dockerfile` | `apilive.v0x.lol` |
| **Web** | `apps/web/railway.toml` → `infrastructure/docker/Dockerfile.web` | `live.v0x.lol` |
| **LiveKit** | `infrastructure/livekit/railway.toml` → `infrastructure/docker/Dockerfile.livekit` | `lklive.v0x.lol` |
| **Redis** | Plugin (sem Dockerfile) | — |

Detalhe config-as-code: [`railway-services.md`](railway-services.md).

4. Em cada serviço: **Settings → Custom Domain** → CNAME no DNS conforme a Railway indicar.
5. Colar variáveis de **`.env.railway`** (bloco por serviço).
6. **Web:** definir `VITE_*` como **variables** do serviço (Railway passa como build args ao Docker se os nomes coincidirem com `ARG` do Dockerfile).
7. Redeploy do **web** após alterar `VITE_*` (são baked no build).

## 1. API (Go)

Healthcheck: `GET /health` · `GET /ready`

Railway injeta `PORT`; a API escuta `:${PORT}` automaticamente.

Variáveis principais (bloco **SERVIÇO API** em `.env.railway`):

- `MONGO_URL`
- `APP_ENV=production` · `TRUST_PROXY=true`
- `APP_URL=https://live.v0x.lol`
- `CORS_ALLOWED_ORIGINS=https://live.v0x.lol`
- `LIVEKIT_URL=wss://lklive.v0x.lol`
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` (igual a `LIVEKIT_KEYS` no LiveKit)
- `GOOGLE_REDIRECT_URI=https://apilive.v0x.lol/api/v1/auth/google/callback`

## 2. Web (Vite + nginx)

Build args / env no build:

- `VITE_API_URL=https://apilive.v0x.lol`
- `VITE_WS_URL=wss://apilive.v0x.lol`
- `VITE_LIVEKIT_URL=wss://lklive.v0x.lol`

Domínio: **`live.v0x.lol`**

## 3. LiveKit + Redis

A API **não** corre LiveKit; só emite tokens JWT.

No serviço **LiveKit**:

- `LIVEKIT_KEYS` (formato `key: secret`)
- `REDIS_URL` ou referências `REDISHOST`, `REDISPORT`, `REDISUSER`, `REDIS_PASSWORD` do plugin Redis

Domínio: **`lklive.v0x.lol`** → `wss://lklive.v0x.lol` na API e no web.

WebRTC na Railway pode exigir ajustes extra (UDP/portas); validar palco no browser após DNS propagar.

## 4. Checklist pós-deploy

1. `https://apilive.v0x.lol/health` OK  
2. `https://live.v0x.lol` carrega  
3. Guest login / cookies (sem erro CORS)  
4. Sala → token LiveKit → palco conecta (`wss://lklive.v0x.lol`)  

## Ficheiros locais (dev)

| Ficheiro | Uso |
|----------|-----|
| `apps/api/.env` | API local |
| `apps/web/.env.development` | Vite local |
| `infrastructure/livekit/.env` | Referência LiveKit/Redis |
| `.env.railway` | Copiar para Railway |

Local: `docker compose up` + `pnpm dev` — LiveKit em `ws://localhost:7880`.

[Railway Docs](https://docs.railway.com/)
