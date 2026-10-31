# Log de remediação

| ID | Ação | Arquivos principais |
|----|------|---------------------|
| VOX-001 | Bloqueio join private por ObjectID | `rooms/service.go`, `rooms/handler.go` |
| VOX-002 | Preview 404 para private | `rooms/handler.go` |
| VOX-003 | `safeRelativePath` OAuth | `auth/google.go` |
| VOX-004 | WS Origin em produção | `realtime/handler.go` |
| VOX-005 | `TRUST_PROXY` | `config/config.go`, `middleware/ratelimit.go` |
| VOX-006 | Nomes reservados + chat UI | `auth/displayname.go`, `auth/handler.go`, `users/handler.go`, `ChatPanel.tsx` |
| VOX-007 | Limite JSON | `httpx/response.go` |
| VOX-008 | Thumbnail HTTPS | `music/oembed.go`, `music/handler.go` |
| VOX-009 | LiveKit TTL 15m | `streaming/handler.go` |
| VOX-010 | Google upsert por `google_id` | `auth/google.go` |
| Infra | CSP/nginx, CI security | `infrastructure/nginx/web.conf`, `.github/workflows/security.yml` |
| Docs | Pacote `docs/security/` | este diretório |
| VOX-011 | Join-by-code + política `CanDirectJoin` | `rooms/joinpolicy.go`, `rooms/service.go`, `rooms/handler.go` |
| Fase 2 | Rate limit guest + eviction IPs | `middleware/ratelimit.go`, `config/config.go`, `server/server.go` |
| Fase 3 | Go 1.26.10, Vitest 3.2.7, override tinypool | `go.mod`, `apps/web/package.json`, `package.json` |
| Fase 1 | Testes integração MongoDB | `rooms/service_integration_test.go` |
| Docs | TESTING_STRATEGY, PRODUCTION checklist | `TESTING_STRATEGY.md`, `PRODUCTION_SECURITY_CHECKLIST.md` |

## Testes de regressão

- `apps/api/internal/auth/displayname_test.go`
- `apps/api/internal/rooms/joinpolicy_test.go`
- `apps/api/internal/rooms/service_security_test.go`
- `apps/api/internal/rooms/service_integration_test.go` (`-tags=integration`)
- `apps/api/internal/middleware/ratelimit_test.go`
- Testes existentes: `chat/sanitize_test.go`, `music/youtube_test.go`

## Verificação

```bash
cd apps/api && go test ./... -count=1
cd apps/api && go test -tags=integration ./internal/rooms/... -count=1
cd apps/api && govulncheck ./...
cd apps/web && pnpm exec tsc -b --noEmit
pnpm --filter @v0xlive/web test
pnpm audit --audit-level=high
```
