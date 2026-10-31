# V0x Live — design system

## Brief

Plataforma de salas ao vivo (tela, voz, vídeo). Público: criadores e grupos que querem transmitir rápido no navegador. Marca: `public/brand-mark.webp`.

## Concept card

```
Idea:        transmissão ao vivo como sinal que corta o ruído, no preto do estúdio
Metaphor:    estúdio de broadcast monocromático, onda no ar
Signature:   logo V0x no hero com pulso de “on air” e barra de progresso de scroll
Emotion:     foco, tensão calma, pronto para ir ao vivo
Motion verb: snap like a shutter — entradas secas, hovers que deslocam levemente
Screenshot:  hero preto, logo grande, tipografia branca, grid sutil, CTA branco
```

## Palette (CSS `@theme` em `src/styles/index.css`)

| Role | Token | Hex |
|------|--------|-----|
| ground | `--color-background` | `#000000` |
| curtain / painel | `--color-surface` | `#0a0a0a` |
| ink | `--color-foreground` | `#fafafa` |
| muted | `--color-muted` | `#8c8c8c` |
| line | `--color-border` | `#2e2e2e` |
| accent (CTA) | `--color-accent` | `#ffffff` |

Monocromático em todo o produto (home, explorar, dashboard): preto, cinzas frios e branco. Sem tons quentes/caramelo na UI.

## Type

- Display & body: **Geist Sans** (variável)
- Meta / códigos: **Geist Mono**

## Layout

- **Home:** `BentoShell` com `showMetaBar` (barra meta de 4 colunas só na landing)
- **Resto do site (explorar, dashboard, perfil, auth, 404, gate de sala):** `SiteCatalogShell` — `home-page` + `site-container home-bento`, sem barra meta
- **Sala ao vivo:** `room-stage-shell` (chrome próprio da transmissão)

## Motion

- Ease: `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-signal`)
- Reduced motion: respeitar `prefers-reduced-motion` nos componentes com Framer Motion
