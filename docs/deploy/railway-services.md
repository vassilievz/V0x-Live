# Railway — 3 serviços + Redis

O erro **“No start command detected” (Railpack)** aparece quando a Railway trata o **monorepo Node na raiz** com Railpack.  
Este projeto usa **Dockerfile por serviço** — não precisas de `build`/`start` manual no painel se o builder estiver certo.

## 1. Criar serviços no mesmo project

| Nome sugerido | Config-as-code (Settings) | Dockerfile (automático via toml) |
|---------------|---------------------------|----------------------------------|
| **v0x-web** | `apps/web/railway.toml` | `infrastructure/docker/Dockerfile.web` |
| **v0x-api** | `apps/api/railway.toml` | `apps/api/Dockerfile` |
| **v0x-livekit** | `infrastructure/livekit/railway.toml` | `infrastructure/docker/Dockerfile.livekit` |
| **Redis** | — | Plugin **Redis** (marketplace) |

**Root Directory:** `/` (raiz do repo) em todos.  
**Não** uses um único serviço na raiz sem config file — isso dispara o Railpack.

### Onde meter o config file

Em cada serviço: **Settings → Config-as-code → Railway Config File** → caminho da tabela acima → Save → Redeploy.

O `railway.toml` na **raiz** existe só como fallback do front; **API e LiveKit** têm de apontar ao **seu** ficheiro.

## 2. Builder (obrigatório)

Em **Settings → Build**:

- **Builder:** `Dockerfile` (ou “Docker”)
- **Desliga** Nixpacks/Railpack se houver toggle
- Não preencher “Custom Build Command” / “Custom Start Command” quando usas Dockerfile

Com Dockerfile, build e start vêm da imagem:

| Serviço | Build (Docker) | Start (Docker) |
|---------|----------------|----------------|
| **API** | `go build` no Dockerfile | `api` (escuta `$PORT`) |
| **Web** | `pnpm build` + nginx | nginx em `$PORT` |
| **LiveKit** | imagem `livekit-server` + entrypoint | `livekit-server --config …` |

## 3. Se insistires em comandos no painel (não recomendado)

Só se **não** usares Dockerfile:

| Serviço | Build command | Start command |
|---------|---------------|---------------|
| Web | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @v0xlive/web build` | `npx serve apps/web/dist -s -l $PORT` |
| API | — | Usar Dockerfile Go; Railpack não deteta entry Go na raiz |
| LiveKit | — | Usar Dockerfile LiveKit |

Para produção, mantém **Dockerfile**.

## 4. Variáveis

Copiar de **`.env.railway`** (blocos WEB / API / LIVEKIT).  
Web: `VITE_*` no serviço **v0x-web** (rebuild após mudar).

## 5. Domínios

| Serviço | Domínio |
|---------|---------|
| Web | `live.v0x.lol` |
| API | `apilive.v0x.lol` |
| LiveKit | `lklive.v0x.lol` |

Ver [`domains.md`](domains.md) e [`railway.md`](railway.md).
