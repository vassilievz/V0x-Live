/** Layout shell — Tailwind (substitui site/home bento CSS). */
export const homePage =
  "home-page py-[clamp(20px,3vw,32px)] pb-[clamp(40px,6vw,64px)] bg-background";

export const homeBento =
  "home-bento border border-border bg-background shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_8%,transparent)]";

export const homeBentoPanel = "border-b border-border last:border-b-0";

export const homeMetaBar =
  "home-meta-bar grid grid-cols-4 border-b border-border [&>span]:px-4 [&>span]:py-[13px] [&>span]:font-mono [&>span]:text-[10px] [&>span]:uppercase [&>span]:tracking-[0.08em] [&>span]:text-muted [&>span]:border-r [&>span]:border-border [&>span:last-child]:border-r-0";

export const homeCellCode =
  "inline-block mb-3.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted";

export const homeSectionTitle =
  "home-section-title font-display text-[clamp(1.65rem,3vw,2.35rem)] font-bold tracking-[-0.03em] leading-[1.12] max-w-[18ch] pb-[0.06em]";

export const homeSectionHead =
  "home-section-head flex items-end justify-between gap-5 px-[var(--bento-pad-x)] pt-[var(--bento-pad-y)] pb-[var(--bento-head-gap)] max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-2.5 [&_.home-cell-code]:mb-0 [&_.home-cell-code]:self-end [&_.home-cell-code]:pb-[0.2em]";

export const sitePanel = "px-[var(--bento-pad-x)] py-[var(--bento-pad-y)]";

export const sitePanelCompact = "py-[calc(var(--bento-pad-y)-6px)] px-[var(--bento-pad-x)]";

export const sitePanelFlush = "p-0";

export const sitePanelSubtitle =
  "mb-4 mt-2 text-base font-semibold tracking-[-0.015em]";

export const siteBackLink = "min-h-0 text-[13px]";

export const siteWorkspaceGrid =
  "grid grid-cols-[1.25fr_0.75fr] items-stretch border-t border-border max-[900px]:grid-cols-1";

export const siteWorkspaceMain =
  "min-w-0 border-r border-border max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:border-border";

export const siteWorkspaceAside =
  "grid min-w-0 grid-rows-[auto_1fr]";
