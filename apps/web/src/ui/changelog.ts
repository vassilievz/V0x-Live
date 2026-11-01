export const changelogDialogBackdrop =
  "fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-[rgb(0_0_0/82%)] p-0 backdrop-blur-[3px] sm:items-center sm:p-[var(--gutter)]";

export const changelogDialogPanel =
  "changelog-dialog relative m-0 flex w-full max-h-[min(92dvh,820px)] flex-col overflow-hidden rounded-t-[20px] rounded-b-none border border-border bg-surface shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_8%,transparent),0_-24px_80px_rgb(0_0_0/55%)] max-sm:max-h-[min(94dvh,820px)] sm:max-w-[min(100%,42rem)] sm:rounded-xl sm:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_8%,transparent),0_32px_120px_rgb(0_0_0/65%)]";

export const changelogDialogScroll =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pt-4 px-[var(--bento-pad-x)] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(3.75rem,env(safe-area-inset-top))] sm:py-8 sm:pt-16";

export const changelogDialogClose =
  "absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex size-11 items-center justify-center rounded-lg border border-border bg-[color-mix(in_oklab,var(--color-surface)_92%,var(--color-foreground))] text-muted shadow-sm transition-[color,background-color,border-color] duration-[180ms] hover:border-muted hover:bg-surface-muted hover:text-foreground sm:right-4 sm:top-4";

export const changelogTimeline =
  "relative border-l border-[color-mix(in_oklab,var(--destructive)_35%,var(--color-border))] pl-6 sm:pl-8";

export const changelogTimelineDot =
  "absolute -left-[5px] top-1 size-2.5 rounded-full bg-[var(--destructive)] ring-4 ring-surface";

export const changelogVersionTag =
  "font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--destructive)]";

export const changelogReleaseDate =
  "font-mono text-[10px] uppercase tracking-[0.14em] text-muted";

export const changelogReleaseTitle =
  "mt-2 text-[1.125rem] font-semibold leading-[1.35] tracking-[-0.02em] text-foreground sm:text-[1.25rem]";

export const changelogSectionBadge =
  "mb-2 mt-6 inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]";

export const changelogItemList = "mt-2 grid gap-3";

export const changelogItem =
  "relative pl-4 text-[0.875rem] leading-[1.65] text-muted before:absolute before:left-0 before:top-[0.55em] before:size-1.5 before:rounded-full before:bg-[color-mix(in_oklab,var(--destructive)_55%,var(--color-border))] sm:text-[0.9375rem]";
