# WebRTC / LiveKit

- JWT emitido só por `POST /{roomID}/livekit-token` após join.
- `Room` = ObjectID hex; `Identity` = session ID.
- Grants: `CanPublish` / `CanSubscribe` derivados do participante.
- TTL JWT: **15 minutos** (ajustável no código).

Secret LiveKit só no servidor. Webhooks LiveKit **não** implementados na API.

Config: `LIVEKIT_*`, `infrastructure/livekit/*.yaml`.
