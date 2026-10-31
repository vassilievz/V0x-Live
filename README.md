# V0x Live

Salas ao vivo no navegador: tela, voz, vídeo e chat. Monorepo open-source (React + Go + MongoDB + LiveKit).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Web | React 19, Vite, Tailwind 4 |
| API | Go, MongoDB |
| Realtime | WebSocket + LiveKit |

## Desenvolvimento local

```powershell
pnpm install

# API — copie apps/api/.env.example → apps/api/.env e preencha MONGO_URL
pnpm dev:api

# Web (outro terminal)
pnpm dev:web

# LiveKit local (opcional)
pnpm dev:livekit
```

Redis + LiveKit via Docker: `docker compose up -d` (requer Docker).

## Deploy (Railway)

Guia completo: [`docs/deploy/railway.md`](docs/deploy/railway.md).

## Licença

MIT — ver [`LICENSE`](LICENSE).

## Segurança

Nunca commite `.env`. Use `.env.example` como referência. Relatos: abra uma issue no GitHub.
