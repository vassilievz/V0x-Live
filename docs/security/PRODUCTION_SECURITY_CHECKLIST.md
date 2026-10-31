# Checklist de segurança para produção

Use antes de expor o V0x Live à internet. Marque apenas com evidência (CI verde, config revisada, secret manager).

## Segredos e configuração

- [ ] `MONGO_URL`, `LIVEKIT_*`, `GOOGLE_*` em secret manager — nunca defaults de dev
- [ ] `APP_ENV=production` (cookies `Secure`, WS Origin estrito, HSTS)
- [ ] `TRUST_PROXY=true` **somente** atrás de nginx/load balancer que sobrescreve `X-Forwarded-For`
- [ ] Rotação de credenciais após qualquer vazamento em repositório ou log

## Rede e TLS

- [ ] HTTPS terminado no nginx; redirect HTTP→HTTPS
- [ ] CSP validada contra LiveKit, OAuth Google, WSS da API e origens de mídia reais
- [ ] WebSocket upgrade configurado no proxy (`Upgrade`, `Connection`)

## API Go

- [ ] Toolchain Go **≥ 1.26.10** (corrige GO-2026-6809, GO-2026-6617)
- [ ] Rate limits revisados: `RATE_LIMIT_*`, `AUTH_GUEST_RATE_*`
- [ ] Testes de integração MongoDB verdes no CI
- [ ] `go test -race` verde no CI Linux

## Autorização

- [ ] Salas privadas: join direto por ObjectID bloqueado; convite via `join-by-code` funcional
- [ ] Preview de sala privada retorna 404
- [ ] Matriz [AUTHORIZATION_MATRIX.md](./AUTHORIZATION_MATRIX.md) revisada para novos endpoints

## LiveKit

- [ ] JWT TTL 15 minutos mantido
- [ ] Keys de produção distintas de dev
- [ ] Decisão sobre webhooks LiveKit documentada (estado atual: ausentes — ver riscos residuais)

## Frontend

- [ ] Vitest ≥ 3.2.6 (dev); `pnpm audit --audit-level=high` limpo ou exceções documentadas
- [ ] Sem tokens de sessão em `localStorage`

## Observabilidade e LGPD

- [ ] Logs sem cookies, tokens OAuth ou corpo de chat completo
- [ ] Processo de exclusão de conta/dados definido (técnico + jurídico)
- [ ] Retenção de `chat_messages` e sessões documentada

## CI/CD

- [ ] Workflow `security.yml` obrigatório em PRs
- [ ] `permissions: contents: read` (ou mínimo necessário)
- [ ] Sem secrets em logs de Actions

## Escala

- [ ] Se **>1 réplica** da API: plano para hub WebSocket (sticky sessions ou Redis pub/sub) — ver [RESIDUAL_RISKS.md](./RESIDUAL_RISKS.md)

## Veredito de release

Só marque “pronto” se não houver vulnerabilidades High/Critical abertas no [VULNERABILITY_REPORT.md](./VULNERABILITY_REPORT.md) e condições acima atendidas ou explicitamente aceitas com owner.
