# Testes de segurança

## Automatizado (CI)

Workflow `.github/workflows/security.yml`:

- `go vet`, `go test`, `govulncheck` (API)
- `tsc -b` (web)
- `pnpm audit` (informativo)

## Local

```bash
cd apps/api && go test ./... -count=1
cd apps/api && govulncheck ./...
cd apps/web && pnpm exec tsc -b --noEmit
pnpm audit
```

## Manual recomendado

- Dois browsers: guest vs host — tentar PATCH permissions como participant.
- Sala private: join por ID deve falhar; join-by-code deve funcionar.
- OAuth: tentar `next=//evil` (deve falhar).

Fuzzing WebSocket/parser: backlog.
