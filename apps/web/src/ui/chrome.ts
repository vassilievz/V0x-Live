import { cn } from "@/lib/cn";

export const siteHeader =
  "sticky top-0 z-50 border-b border-border bg-[color-mix(in_oklab,var(--color-background)_88%,transparent)] backdrop-blur-md";

export const headerInner =
  "flex min-h-[72px] items-center justify-between gap-6 max-[800px]:min-h-[72px]";

export const brandLink = "inline-flex shrink-0 items-center gap-3 [&_img]:h-[29px]";

export const brandName =
  "font-display text-lg font-bold leading-tight tracking-[-0.02em] [&>span]:font-medium [&>span]:text-muted";

export const headerNav = "flex items-center gap-5 max-[800px]:hidden";

export const headerActions = "flex items-center gap-5 max-[800px]:hidden";

export const navLink =
  "relative rounded-lg px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface-muted hover:text-foreground aria-[current=page]:bg-surface-muted aria-[current=page]:text-foreground";

export const menuToggle =
  "hidden min-h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-foreground transition-[background,transform] hover:bg-surface-muted active:scale-[0.98] max-[800px]:inline-flex";

export const mobileNav =
  "grid gap-1 overflow-hidden border-t border-border px-[var(--gutter)] pb-5 [&_a]:border-b [&_a]:border-border [&_a]:py-3.5 [&_a]:text-lg [&_a]:font-semibold [&_a]:tracking-[-0.01em] [&_a]:transition-[color,padding] hover:[&_a]:px-1 hover:[&_a]:text-foreground [&_a[aria-current=page]]:text-accent";

export const mobileNavSession = "py-2 text-sm text-muted";

export const actionLink =
  "action-link relative isolate inline-flex min-h-11 items-center justify-center gap-2.5 overflow-hidden rounded-full border border-border bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-[background,border-color,transform] active:scale-[0.98] hover:bg-foreground [&_svg]:size-4 [&_svg]:transition-transform hover:[&_svg]:translate-x-0.5 hover:[&_svg]:-translate-y-0.5";

export const actionLinkPill = "rounded-full";

export const actionLinkOutline =
  "action-link action-link--outline bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background";

export const textLink =
  "inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 transition-colors hover:text-foreground [&_svg]:size-4 [&_svg]:transition-transform hover:[&_svg]:translate-x-0.5 hover:[&_svg]:-translate-y-0.5";

export const textLinkMuted = "text-muted hover:text-foreground";

export const signalLabel = "inline-flex items-center gap-2";

export const signalDot =
  "inline-block size-[7px] shrink-0 rounded-full bg-foreground shadow-[0_0_8px_color-mix(in_oklab,var(--color-foreground)_40%,transparent)]";

export const statusOnline = "text-success";

export const statusOffline = "text-muted";

export function discordLink(variant?: "header" | "mobile" | "footer") {
  return cn(
    "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[13px] font-semibold text-foreground no-underline transition-[background,border-color,transform] hover:border-muted hover:bg-surface active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-foreground",
    variant === "mobile" &&
      "mt-3 w-full justify-start rounded-lg border-t border-border pt-3",
    variant === "footer" &&
      "min-h-0 rounded-none border-0 bg-transparent px-0 py-[3px] text-xs font-medium hover:border-transparent hover:bg-transparent",
  );
}

export const discordIcon = "block size-5 shrink-0 text-foreground";

export const localeSwitcher = "relative z-[60] inline-flex flex-col items-stretch";

export const localeTrigger =
  "inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-3 py-1 pl-2 text-[13px] font-semibold text-foreground transition-[background,border-color,transform] hover:border-muted hover:bg-surface active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-foreground";

export const localeTriggerOpenState = "[.is-open_&]:border-muted [.is-open_&]:bg-surface";

export const localeTriggerOpen = cn(localeTrigger, localeTriggerOpenState);

export const localeFlagSvg =
  "block size-[21px_15px] rounded-sm border border-border bg-background";

export const localeTriggerLabel = "locale-trigger-label max-w-36 truncate";

export const localeChevron =
  "locale-chevron ml-0.5 shrink-0 text-muted transition-transform [.is-open_&]:rotate-180";

export const localeMenu =
  "locale-menu locale-menu-animate absolute right-0 top-[calc(100%+8px)] m-0 min-w-[min(16.5rem,calc(100vw-var(--gutter)*2))] list-none overflow-hidden rounded-xl p-0 [&_li+li]:border-t [&_li+li]:border-border";

export const localeOption =
  "flex min-h-11 w-full items-center gap-2.5 border-0 bg-background px-3 py-2.5 text-left font-[inherit] text-[13px] font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-foreground";

export const localeOptionActive = "is-active bg-surface-muted text-foreground";

export const userAvatarBase =
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_oklab,var(--color-foreground)_28%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-foreground)_12%,var(--color-surface-muted))] font-bold tracking-[-0.02em] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/6%)] [&_img]:size-full [&_img]:object-cover";

export const userAvatarSm = "size-8 text-[11px]";
export const userAvatarMd = "size-10 text-xs";
export const userAvatarLg = "size-[72px] text-lg";
export const userAvatarFallback = "leading-none";

export const headerActionsCompact = "[&_.action-link]:min-h-10 [&_.action-link]:gap-2 [&_.action-link]:px-3.5 [&_.action-link]:py-2 [&_.action-link]:text-[13px]";

export const headerSessionMenu = "header-session-menu relative z-[60]";
export const headerSessionMenuOpen = "is-open";

export const headerSessionChip =
  "header-session-chip inline-flex max-w-[min(220px,42vw)] items-center rounded-full border border-border bg-surface p-0 [.is-open_&]:border-muted [.is-open_&]:bg-surface";
export const headerSessionChipPending =
  "header-session-chip header-session-chip--pending inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-3 py-1 pl-1 opacity-[0.72]";
export const headerSessionChipTrigger =
  "header-session-chip-trigger inline-flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-[inherit] border-0 bg-transparent px-3 py-1 pl-1 text-left font-[inherit] text-inherit transition-colors duration-[180ms] hover:bg-[color-mix(in_oklab,var(--color-foreground)_4%,var(--color-surface))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
export const headerSessionName =
  "min-w-14 flex-1 truncate text-[13px] font-semibold text-foreground";
export const headerSessionDropdown =
  "header-session-dropdown locale-menu-animate absolute right-0 top-[calc(100%+8px)] min-w-[min(15rem,calc(100vw-var(--gutter)*2))] overflow-hidden rounded-xl py-3.5 pb-1.5";
export const headerSessionDropdownKicker =
  "flex items-center gap-2.5 px-4 pb-2 text-[11px] uppercase tracking-[0.06em] text-muted";
export const headerSessionDropdownName =
  "text-[15px] font-semibold tracking-[-0.02em]";
export const headerSessionDropdownPreview =
  "flex items-center gap-3 border-b border-border px-4 pb-3.5";
export const headerSessionDropdownForm =
  "grid gap-3.5 px-4 py-3.5 pb-3 [&_.field-help]:mt-1.5";
export const headerSessionDropdownActions = "flex flex-col";
export const headerSessionDropdownItem =
  "header-session-dropdown-item flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 text-[13px] font-medium text-foreground no-underline transition-colors duration-[160ms] hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-[0.55] [&+&]:border-t [&+&]:border-border [&_svg]:shrink-0 [&_svg]:text-muted";

export const localeMenuAnimate = "locale-menu-animate";

export function localeSwitcherClasses(variant?: "header" | "mobile") {
  return cn(
    localeSwitcher,
    variant === "mobile" &&
      "locale-switcher--mobile mt-3 w-full border-t border-border pt-3 [&_.locale-menu]:static [&_.locale-menu]:mt-2 [&_.locale-menu]:w-full [&_.locale-menu]:min-w-0 [&_.locale-menu]:animate-none [&_.locale-trigger]:w-full [&_.locale-trigger]:justify-start [&_.locale-trigger]:rounded-lg",
  );
}

export const localeOptionLabel = "min-w-0 flex-1";
export const localeOptionMeta = "inline-flex shrink-0 items-center gap-2";
export const localeOptionCode = "mb-0";
export const localeOptionCheck = "size-3.5 text-foreground";

export const localeSwitcherOpen = "is-open";
