# Modelo de ameaças (STRIDE)

## Ativos

- Contas Google / perfis
- Sessões (`v0x_session`, hash SHA-256 no MongoDB)
- Salas privadas (invite code, senha opcional)
- Chat e metadados de música
- Streams WebRTC (LiveKit)

## Fronteiras de confiança

1. **Browser → API** (REST + WebSocket + cookies)
2. **Browser → LiveKit** (JWT assinado pela API)
3. **API → MongoDB**
4. **API → Google OAuth / YouTube oEmbed**
5. **Operador → Docker** (Redis/LiveKit expostos em dev)

## STRIDE (resumo)

| Ameaça | Exemplo | Controles |
|--------|---------|-----------|
| Spoofing | Guest finge ser sistema | Nomes reservados; chat system só `kind=system` |
| Tampering | Escalar role via API | `PatchPermissions` só host; LiveKit `CanPublish` do DB |
| Repudiation | Negar ação | Logs estruturados limitados (melhorar auditoria) |
| Info disclosure | Preview de sala privada | 404 para private; join direto bloqueado |
| DoS | JSON gigante / flood guest | Limite 1 MiB JSON; rate limit global |
| Elevation | Entrar em sala private por ObjectID | `ErrPrivateJoinRequiresInvite` |

## Caminhos de ataque priorizados

1. BOLA em salas (join/preview) — **corrigido nesta auditoria**
2. Token LiveKit longo ou permissivo — TTL reduzido; grants mínimos
3. CSWSH / Origin vazio no WebSocket — Origin vazio negado em produção
4. Rate limit bypass via `X-Forwarded-For` — só com `TRUST_PROXY=true` atrás de proxy confiável
5. Supply chain (Vitest/tinypool dev) — ver `pnpm audit`; CI com audit

Ver inventário em [ATTACK_SURFACE.md](./ATTACK_SURFACE.md).
