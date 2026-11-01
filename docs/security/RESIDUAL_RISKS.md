# Riscos residuais

## Alto impacto operacional

1. **Escala horizontal da API:** hub WebSocket in-memory não replica eventos entre pods. Mitigação: sticky sessions ou Redis pub/sub (ADR pendente).
2. **Secrets default LiveKit/Mongo em dev:** garantir override em produção e rotação periódica.

## Médio

3. ~~**Rate limit global único (120 rps):** sem bucket dedicado para `/auth/guest`~~ — **Mitigado:** `AUTH_GUEST_RATE_*` + middleware dedicado.
4. ~~**Mapa `visitors` do rate limiter:** crescimento ilimitado~~ — **Mitigado:** TTL + `RATE_LIMIT_MAX_IPS`.
5. **CSP no nginx:** pode exigir ajuste fino para LiveKit/WSS em produção — validar contra deploy real.
6. ~~**govulncheck:** vulnerabilidades em stdlib Go 1.26.x~~ — **Mitigado no repositório:** `go 1.26.10` + CI; validar imagem de runtime.

## Baixo / processo

7. ~~**pnpm audit (dev):** Vitest/tinypool críticos~~ — **Mitigado:** Vitest 3.2.7 + `pnpm.overrides` tinypool ≥2.1.2. ~~**zod** high (<4.6.6)~~ — **Mitigado:** dependência direta removida (não usada no código); `pnpm audit --audit-level=high` limpo.
8. **OpenAPI desatualizado:** rotas fantasma no YAML — risco de documentação enganosa, não bypass runtime.
9. **Sem go test -race em CI Windows local:** CI Linux executa `-race`; local Windows/386 continua limitado.
10. **LGPD:** política de retenção/exclusão de conta — revisão legal além do escopo técnico.
11. **Convites:** sem expiração/revogação por código individual — fechamento da sala revoga acesso (`status=closed`).

## Veredito pós-correções

**CONDITIONALLY READY** — controles High priorizados corrigidos e testados onde há Mongo/CI; permanecem webhooks LiveKit, escala WebSocket multi-réplica, CSP em produção real, OpenAPI e upgrade Zod 4.
