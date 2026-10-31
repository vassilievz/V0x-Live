# Domínios de produção (v0x.lol)

| Serviço | Domínio | Railway |
|--------|---------|---------|
| **Front** | `https://live.v0x.lol` | Serviço Web → Settings → Custom Domain |
| **API** | `https://apilive.v0x.lol` | Serviço API → Custom Domain |
| **LiveKit** | `wss://lklive.v0x.lol` | Serviço LiveKit → Custom Domain (3.º serviço) |

DNS: CNAME de cada host para o target que a Railway mostrar (por serviço).

Google OAuth (se usar): redirect autorizado  
`https://apilive.v0x.lol/api/v1/auth/google/callback`

Valores centralizados em `.env.railway` (gitignored).
