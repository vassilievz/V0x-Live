# API (OWASP API Top 10)

Enforcement central: `apps/api/internal/server/server.go`.

| Risco | Estado |
|-------|--------|
| API1 BOLA | Salas/chat/música exigem participante ativo; private join corrigido |
| API2 Auth | Cookie session; sem JWT no browser |
| API3 BOPA | PATCH users só campos permitidos; music patch validado |
| API4 Consumo | Rate limit global; limite JSON 1 MiB |
| API5 BFLA | Host-only close/patch permissions |
| API6 Fluxos | Guest barato — monitorar abuse |
| API7 SSRF | oEmbed só URLs YouTube canonicalizadas |
| API8 Misconfig | CORS allowlist; headers segurança |
| API9 Inventário | OpenAPI parcialmente desatualizado |
| API10 Consumo externo | Google userinfo limitado 1 MiB |

Contrato: `apps/api/api/openapi.yaml`.
