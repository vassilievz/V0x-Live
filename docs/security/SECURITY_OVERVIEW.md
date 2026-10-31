# V0x Live — Visão geral de segurança

## Arquitetura

| Camada | Tecnologia | Papel |
|--------|------------|--------|
| Frontend | React (Vite) | UI; sessão via cookie HttpOnly |
| API | Go (chi) | Autenticação, autorização, tokens LiveKit, WebSocket |
| Dados | **MongoDB** (não PostgreSQL) | Usuários, sessões, salas, chat, música |
| Mídia | LiveKit + WebRTC | Áudio/vídeo/tela (fora da API) |
| Cache LiveKit | Redis (Docker Compose) | **Não** usado pela API Go |

## Princípios

- **Zero trust no cliente:** roles, ownership e permissões são validados na API.
- **Deny-by-default:** rotas protegidas exigem sessão; salas privadas exigem código de convite.
- **Segredos só no servidor:** OAuth client secret, LiveKit API secret, `MONGO_URL` nunca no bundle web.

## Documentação relacionada

- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [ATTACK_SURFACE.md](./ATTACK_SURFACE.md)
- [AUTHORIZATION_MATRIX.md](./AUTHORIZATION_MATRIX.md)
- [VULNERABILITY_REPORT.md](./VULNERABILITY_REPORT.md)
- [REMEDIATION_LOG.md](./REMEDIATION_LOG.md)
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- [PRODUCTION_SECURITY_CHECKLIST.md](./PRODUCTION_SECURITY_CHECKLIST.md)

## O que o servidor pode ver

Não há criptografia ponta-a-ponta entre participantes. O servidor persiste chat, metadados de salas e emite JWT LiveKit. LiveKit media planeja tráfego WebRTC; política de gravação depende da configuração LiveKit.

## Contatos e incidentes

Rotacionar credenciais expostas imediatamente (`LIVEKIT_*`, `GOOGLE_*`, `MONGO_URL`). Ver [SECRETS_MANAGEMENT.md](./SECRETS_MANAGEMENT.md).
