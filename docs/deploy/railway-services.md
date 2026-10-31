# Railway — 3 serviços Git + plugin Redis

## “Mudei o Dockerfile e ainda sobe nginx”

**Nginx = sempre o WEB.** O contentor LiveKit **nunca** corre nginx.

Isso significa **uma** destas coisas:

1. Estás a ver os **logs do serviço Web** (outro card no project), não do LiveKit.  
2. Só tens **um** serviço Git — ele continua com `Dockerfile.web`.  
3. Alteraste o Dockerfile noutro sítio e **não guardaste** / não fizeste **Redeploy** no serviço certo.  
4. Criaste **dois** serviços ligados ao repo mas **os dois** têm o mesmo Dockerfile path (web).

**Fix:** cria (ou usa) um **serviço separado** só para LiveKit e confirma o path **nesse** serviço.

---

## Passo a passo: serviço LiveKit NOVO (não reutilizar o Web)

1. No **project Railway** → **+ New** → **GitHub Repo** → escolhe **o mesmo repo** outra vez.  
   (Sim, **3 serviços** = 3 ligações ao mesmo repo.)

2. Renomeia o serviço: **`v0x-livekit`**.

3. **Settings → Build** (deste serviço, não do web):

   | Campo | Valor exato |
   |--------|-------------|
   | Builder | **Dockerfile** |
   | Dockerfile path | `infrastructure/docker/Dockerfile.livekit` |

4. **Save** → **Deploy** → **View logs**.

   - **Certo:** linha `=== V0X LIVEKIT` e depois logs do `livekit-server` (ou erro Redis).  
   - **Errado:** `nginx/1.31.8` → ainda é web; o path **deste** serviço está `Dockerfile.web` ou Railpack.

5. **Variables** neste serviço só:

   ```env
   REDIS_URL=<Reference → plugin Redis → REDIS_URL>
   LIVEKIT_KEYS=v0xlive_prod: …
   ```

6. **Networking** → Custom domain `lklive.v0x.lol` (quando DNS estiver pronto).

O serviço **Web** mantém **sempre**:

`infrastructure/docker/Dockerfile.web` → logs nginx (normal).

---

## Config-as-code (`railway.toml`) deprecado

Se **Add File Path** volta ao original ou não grava, configura **só no painel** (secção abaixo).  
Os ficheiros `apps/*/railway.toml` ficam como **referência** no repo; a Railway pode ignorá-los.

## Redis ≠ deploy do Git

O **Redis** é **plugin** (Add → Database → Redis). **Não** ligues o repo Git ao Redis.  
**Não** há `railway.toml` no Redis — só variáveis geradas pela Railway (`REDIS_URL`, …).

Se “subiu o front” num serviço que querias Redis: criaste um **serviço Git** em vez do **plugin Redis**, ou o serviço Git usa Dockerfile **web** por defeito.

---

## Criar 4 coisas no project

| # | Tipo | Nome | O que faz |
|---|------|------|-----------|
| 1 | **Plugin** | Redis | Só dados; sem Git |
| 2 | **Git repo** | v0x-web | Front |
| 3 | **Git repo** | v0x-api | API Go |
| 4 | **Git repo** | v0x-livekit | LiveKit |

Mesmo repositório GitHub nos 3 serviços Git; **Settings diferentes** em cada um.

---

## v0x-web (live.v0x.lol)

**Settings → Build**

| Campo | Valor |
|--------|--------|
| Builder | **Dockerfile** |
| Dockerfile path | `infrastructure/docker/Dockerfile.web` |
| Root directory | `/` (vazio ou raiz) |
| Custom Build Command | **vazio** |
| Custom Start Command | **vazio** |

**Variables**

```env
VITE_API_URL=https://apilive.v0x.lol
VITE_WS_URL=wss://apilive.v0x.lol
VITE_LIVEKIT_URL=wss://lklive.v0x.lol
```

**Settings → Networking → Custom Domain:** `live.v0x.lol`

Depois de mudar `VITE_*` → **Redeploy**.

---

## v0x-api (apilive.v0x.lol)

**Settings → Build**

| Campo | Valor |
|--------|--------|
| Builder | **Dockerfile** |
| Dockerfile path | `apps/api/Dockerfile` |
| Custom Build / Start | **vazios** |

**Variables:** bloco **SERVIÇO API** em `.env.railway` (Mongo, CORS, `LIVEKIT_*`, …).

**Custom Domain:** `apilive.v0x.lol`  
**Healthcheck:** `/health`

---

## v0x-livekit (lklive.v0x.lol)

**Settings → Build**

| Campo | Valor |
|--------|--------|
| Builder | **Dockerfile** |
| Dockerfile path | `infrastructure/docker/Dockerfile.livekit` |
| Custom Build / Start | **vazios** |

**Variables**

```env
REDIS_URL=<referência ao plugin Redis, ou colar REDIS_URL>
LIVEKIT_KEYS=v0xlive_prod: <secret>
PORT=8080
```

Com **TCP proxy → :7881**, a Railway **injeta `PORT=7881` no container** (não aparece na lista de variables). Definir **`PORT=8080` no painel** corrige WSS (`lklive`) e o health check.

No LiveKit: **Add variable → Reference** → serviço Redis → `REDIS_URL`.

**Networking:** Custom domain `lklive.v0x.lol` + **TCP Proxy** container port **7881** (mídia).

**Settings → Deploy → Health Check** (se existir no painel): path **`/`**, timeout **≥ 60s**. LiveKit responde `OK` na raiz. Health check errado (`/health`) causa **restart em loop** nos logs (novo `nodeID` a cada ~1s).

---

## Porque “voltava ao original”

1. **Config-as-code** deprecado — muitos projects já **não guardam** file path.  
2. **`railway.toml` na raiz** (removido do repo) apontava sempre para o **Dockerfile web** → qualquer serviço sem path próprio virava front/nginx nos logs.  
3. **Redis** nunca vem do Git; é plugin à parte.

---

## Checklist rápido

- [ ] 1× plugin **Redis** (sem Git)  
- [ ] 3× serviços **Git**, cada um com **Dockerfile path** diferente (tabela acima)  
- [ ] **Não** usar Config File se não persistir — usa Dockerfile path manual  
- [ ] Domínios nos serviços certos (web / api / livekit)

Ver também: [`railway.md`](railway.md), [`domains.md`](domains.md).
