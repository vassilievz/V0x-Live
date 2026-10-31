# Estratégia de testes de segurança

## Objetivo

Provar controles de autorização, autenticação e abuso com evidência reproduzível — não apenas inspeção estática.

## Camadas

| Camada | Onde | Quando executar |
|--------|------|-----------------|
| Unitário | `apps/api/internal/**`, `apps/web` | Cada PR (`go test ./...`, `pnpm --filter @v0xlive/web test`) |
| Integração MongoDB | `apps/api/internal/rooms/service_integration_test.go` | CI (`go-integration`) e local com Mongo |
| Race | Go `-race` | CI Linux (`go-security`) |
| Dependências | `govulncheck`, `pnpm audit` | CI `security.yml` |

## Integração MongoDB

Build tag **`integration`**. URI:

- CI: `MONGO_TEST_URI=mongodb://127.0.0.1:27017/v0xlive_integration_test` (service container)
- Local: mesma URI ou `MONGO_TEST_URI` customizado

```bash
cd apps/api
go test ./... -count=1
go test -tags=integration ./internal/rooms/... -count=1 -v
```

Se Mongo não estiver disponível, os testes de integração fazem **skip** (não falham).

### Cenários cobertos (salas)

- Join direto em sala **pública**
- Bloqueio join direto em sala **privada** (`ErrPrivateJoinRequiresInvite`)
- Entrada privada via **`JoinByInviteCode`**
- Código inválido → `not_found`
- Sala **fechada** → convite não resolve (revogação operacional; não há TTL de convite no modelo atual)
- ObjectID inexistente
- `EnsureActiveParticipant` para usuário fora da sala (BOLA em participantes)
- Política `CanDirectJoin` alinhada ao serviço

**Não implementado no produto (documentado, não testado como bug):** convites por usuário, expiração de código, revogação parcial de convite — apenas código estático por sala até evolução do modelo.

## Autorização centralizada

- `CanDirectJoin(room)` — única regra para `POST /rooms/{id}/join`
- `JoinByInviteCode` — fluxo de convite sem re-aplicar bloqueio privado

Regressão conhecida corrigida: **VOX-011** (join-by-code chamava `Join` e bloqueava salas privadas).

## Rate limiting

Testes em `middleware/ratelimit_test.go`:

- Burst 429
- `X-Forwarded-For` só com `TRUST_PROXY=true`
- Eviction TTL / teto de IPs
- Concorrência em `get()`

Guest: limite dedicado em `POST /auth/guest` (`AUTH_GUEST_RATE_RPS`, default 8).

## WebSocket / LiveKit / E2E

- WebSocket: testes manuais + revisão de código; hub in-memory — ver [RESIDUAL_RISKS.md](./RESIDUAL_RISKS.md)
- LiveKit: TTL JWT 15m; webhooks ainda ausentes — testes negativos pendentes quando implementados
- E2E browser: fora do escopo mínimo desta rodada; recomendado Playwright em staging

## Fuzzing (próximos passos)

Alvos sugeridos: `httpx.DecodeJSON`, parsers de ObjectID, sanitização de chat, payloads WS.

## Comandos reproduzíveis

```bash
cd apps/api
go vet ./...
go test ./... -count=1
go test -tags=integration ./internal/rooms/... -count=1
govulncheck ./...

cd ../..
pnpm exec tsc -b --noEmit
pnpm --filter @v0xlive/web test
pnpm audit --audit-level=high
```

## CI

Workflow `.github/workflows/security.yml`: vet, test, race, govulncheck, integração Mongo, typecheck, vitest, audit (high+ falha o job).
