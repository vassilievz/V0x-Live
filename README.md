# V0x Live

Browser-native group rooms for screen sharing, voice, video, and chat. Open-source monorepo built with React, Go, MongoDB, and LiveKit.

## Architecture

| Layer | Stack |
|-------|--------|
| Web | React 19, Vite, Tailwind CSS 4 |
| API | Go (Chi), MongoDB |
| Realtime | WebSocket hub, LiveKit (WebRTC) |

Public site: [live.v0x.lol](https://live.v0x.lol)  
API: [apilive.v0x.lol](https://apilive.v0x.lol)

## Prerequisites

- Node.js 22+ and pnpm 9 (see `packageManager` in root `package.json`)
- Go 1.26+
- MongoDB 7+ (local or Docker)
- LiveKit server (optional for local media; see below)

## Local development

```bash
pnpm install
```

**API**

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Set `MONGO_URL` and session/LiveKit variables as documented in the example file.

```bash
pnpm dev:api
```

**Web** (separate terminal):

```bash
pnpm dev:web
```

**LiveKit** (optional):

```bash
pnpm dev:livekit
```

For Redis and LiveKit via Docker:

```bash
docker compose up -d
```

## Quality checks

From the repository root:

```bash
# Go unit tests
cd apps/api && go test ./... -count=1

# Go integration tests (requires MongoDB on MONGO_TEST_URI or default localhost)
cd apps/api && go test -tags=integration ./internal/rooms/... -count=1

# Web typecheck, unit tests, production build
pnpm exec tsc -b --noEmit -p apps/web
pnpm --filter @v0xlive/web test
pnpm build

# Dependency audit (high severity and above)
pnpm audit --audit-level=high
```

CI runs the same checks in [`.github/workflows/security.yml`](.github/workflows/security.yml).

## Deployment

Production deployment on Railway is documented in:

- [`docs/deploy/railway.md`](docs/deploy/railway.md)
- [`docs/deploy/railway-services.md`](docs/deploy/railway-services.md)

Environment templates: `.env.railway` and per-app `.env.example` files.

## Security

Do not commit secrets or `.env` files. Use the provided `.env.example` templates. Report vulnerabilities via GitHub Issues (avoid posting sensitive details in public threads).

## License

MIT — see [`LICENSE`](LICENSE).
