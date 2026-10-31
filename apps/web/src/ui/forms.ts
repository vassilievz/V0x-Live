import { cn } from "@/lib/cn";

/** Focus / catalog / auth form surfaces (Tailwind). */
export const focusPage =
  "py-[clamp(28px,4vw,48px)] pb-[clamp(40px,6vw,64px)] bg-background";

export const focusPageInner = "mx-auto max-w-[32rem]";
export const focusPageInnerAuth = "max-w-[min(100%,960px)]";
export const focusPageInnerFull = "max-w-[var(--page-width)]";

export const focusPageHeader =
  "mb-7 flex flex-wrap items-start justify-between gap-x-6 gap-y-4";

export const focusPageTitle =
  "font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.03em] pb-[0.05em]";

export const focusPageLead =
  "mt-2.5 max-w-[28rem] text-[0.9375rem] leading-relaxed text-muted";

export const focusPageHeaderLinks = "flex flex-wrap items-center gap-x-[18px] gap-y-3";
export const focusPageNotice = "mb-5";
export const focusPageFoot = "mt-6 text-center text-sm text-muted";

export function focusCard(inBento?: boolean) {
  return cn(
    "rounded-lg border border-border bg-background px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_6%,transparent)]",
    inBento && "rounded-none border-0 bg-transparent p-0 shadow-none",
  );
}

export const focusCardTitle =
  "mb-[22px] text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.02em]";

export const focusCardSubtitle =
  "mb-3 flex items-center gap-2 text-sm font-medium text-muted [&_svg]:size-4";

export const focusCardForm = "grid gap-[18px]";
export const focusCardFormInline = "grid gap-2.5";
export const focusCardSection = "mb-[18px]";
export const focusCardDivider = "my-6 h-px bg-border";

export const focusJoinRow =
  "grid grid-cols-[1fr_auto] items-end gap-2.5 max-[480px]:grid-cols-1";

export const catalogFormColumn = "max-w-[32rem]";

export const pageShell = "min-h-[60vh] py-12 pb-[72px]";
export const pageHeading =
  "mb-8 flex items-end justify-between gap-7 max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-[22px]";
export const pageHeadingTitle =
  "font-display text-[var(--type-page)] font-semibold leading-tight tracking-[-0.025em]";
export const pageHeadingLead =
  "mt-2.5 max-w-[36rem] text-[15px] leading-[1.55] text-muted";
export const pageHeadingActions = "flex items-center gap-3";

export const workspaceGrid =
  "grid grid-cols-[1.3fr_0.7fr] items-start gap-7 max-[600px]:grid-cols-1 max-[600px]:gap-[22px]";
export const workspacePanel = "overflow-hidden rounded-none border-0 bg-background";
export const workspaceAside = "grid gap-6";

export const panelHeading =
  "flex items-center gap-2.5 border-b border-border bg-background px-[var(--bento-pad-x)] py-[calc(var(--bento-pad-y)-6px)] [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-muted";
export const panelHeadingTitle =
  "text-base font-semibold leading-[1.35] tracking-[-0.01em]";
export const panelForm =
  "grid gap-5 px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] max-[600px]:p-[22px]";

export const fieldGroup = "grid gap-[9px]";
export const fieldLabel = "text-[13px] font-medium text-foreground";
export const fieldHelp = "text-[13px] leading-normal text-muted";
export const fieldError = "text-xs leading-normal text-foreground";
export const fieldOk = "text-[13px] font-medium text-muted";

export const visibilityOptions =
  "grid grid-cols-2 gap-3 max-[800px]:grid-cols-1 max-[600px]:grid-cols-2 max-[600px]:gap-2.5";
export const visibilityChoice =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3.5 transition-[border-color,background] duration-[180ms] has-[:checked]:border-foreground has-[:checked]:bg-surface [&_input]:mt-1 [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:text-muted [&_strong]:block [&_strong]:text-[13px] [&_strong]:font-medium max-[600px]:gap-2 max-[600px]:p-3";

export const notice =
  "flex items-center gap-3 rounded-none border border-border px-[clamp(20px,3vw,22px)] py-[18px] text-[13px] text-muted [&_svg]:size-[18px] [&_svg]:shrink-0";
export const noticeError =
  "border-border bg-surface text-foreground";

export const inviteNote =
  "border-t border-border px-[clamp(20px,3vw,24px)] py-[18px] text-xs leading-relaxed text-muted";

export const roomsToolbar =
  "flex flex-col gap-4 border-b border-border bg-background px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] lg:flex-row lg:items-center lg:justify-between [&>p]:shrink-0 [&>p]:font-mono [&>p]:text-[10px] [&>p]:uppercase [&>p]:tracking-[0.08em] [&>p]:text-muted";

export const roomsToolbarRow =
  "flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:justify-end";

export const roomsToolbarFilters = roomsToolbarRow;

export const roomsFilterSelect =
  "min-h-11 w-auto min-w-[9.75rem] shrink-0 cursor-pointer appearance-none rounded-lg border border-border bg-background bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat px-3.5 py-2.5 pr-9 text-[13px] text-foreground [background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%238c8c8c%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')] max-[480px]:min-w-0 max-[480px]:flex-1";

export const googleSignInLink =
  "google-sign-in inline-flex min-h-11 w-full flex-row flex-nowrap items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-4 py-2.5 text-[13px] font-semibold leading-none text-foreground no-underline transition-[background,border-color,transform] hover:border-muted hover:bg-surface active:scale-[0.98]";

export const roomsSearch =
  "relative min-w-[10rem] flex-1 basis-[12rem] max-w-md [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-[15px] [&>svg]:size-4 [&>svg]:text-muted [&_input]:pl-10";

export const roomsGrid =
  "m-0 grid list-none grid-cols-3 gap-0 p-0 max-[800px]:grid-cols-2 max-[600px]:grid-cols-1";
export const roomsGridExplore =
  "rooms-grid-explore m-0 grid list-none grid-cols-3 gap-0 border-0 border-t border-border p-0 max-[600px]:grid-cols-1";

export const roomCard =
  "overflow-hidden rounded-none border-0 border-b border-r border-border bg-background transition-colors duration-200 hover:bg-surface";
export const roomCardVisual =
  "relative flex h-28 items-center justify-center border-b border-border bg-secondary max-[600px]:h-24 [&>svg]:size-7 [&>svg]:text-muted data-[live=true]:bg-surface data-[live=true]:shadow-[inset_0_2px_0_var(--color-foreground)] data-[live=true]:[&>svg]:text-foreground";
export const roomStatus =
  "absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-foreground";
export const roomCardBody =
  "px-[clamp(18px,2.5vw,22px)] pb-[22px] pt-[18px] [&_.home-cell-code]:mb-2.5";
export const roomCardTitle =
  "overflow-wrap-anywhere text-[1.0625rem] font-semibold tracking-[-0.01em]";
export const roomCardMeta =
  "mt-4 flex items-center justify-between gap-3 text-[13px] text-muted [&>span]:flex [&>span]:items-center [&>span]:gap-1.5 [&_svg]:size-3.5 [&_.text-link:hover]:text-foreground";

export const emptyState =
  "rounded-none border-0 border-t border-border px-[clamp(20px,3vw,28px)] py-[clamp(48px,8vw,72px)] text-center [&_.home-cell-code]:mb-3 [&_.action-link]:mt-6 [&>svg]:mx-auto [&>svg]:mb-4 [&>svg]:size-[42px] [&>svg]:text-muted [&_h2]:font-display [&_h2]:text-[clamp(1.65rem,3vw,2rem)] [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_p]:mt-2.5 [&_p]:text-sm [&_p]:text-muted";

export const skeletonCard =
  "skeleton-card h-[280px] rounded-none border-0 border-b border-r border-border bg-surface";

export const roomCardExplore =
  "room-card-explore group flex min-h-0 w-full flex-col gap-0 overflow-hidden rounded-none border-0 border-b border-r border-border bg-background p-0 text-inherit no-underline transition-colors duration-200 hover:bg-surface data-[live=true]:shadow-[inset_2px_0_0_var(--color-foreground)] hover:[&_.room-card-explore-cta]:text-foreground [&_.text-link:hover]:shadow-none";
export const roomCardExploreSkeleton =
  "room-card-explore--skeleton pointer-events-none min-h-[280px] rounded-none border-0 border-b border-r border-border bg-surface max-[600px]:min-h-[260px]";
export const roomCardExploreMedia =
  "room-card-explore-media relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-secondary data-[live=true]:bg-surface data-[preview=true]:bg-black";
export const roomCardExploreMediaImg =
  "block h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]";
export const roomCardExploreMediaIdle =
  "flex h-full w-full flex-col items-center justify-center gap-2 text-muted [&>svg]:size-9 [&>svg]:opacity-80 [.room-card-explore-media[data-live=true]_&]:text-foreground [.room-card-explore-media[data-live=true]_&]:[&>svg]:opacity-100";
export const roomCardExploreMediaBadge =
  "absolute left-2.5 top-2.5 z-[2] inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgb(0_0_0/0.78)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground backdrop-blur-sm [&_.signal-dot]:shadow-none";
export const roomCardExploreBody =
  "flex flex-1 flex-col gap-2.5 px-[var(--bento-pad-x)] py-[var(--bento-pad-y)]";
export const roomCardExploreHead = "flex items-center justify-between gap-2.5";
export const roomCardExploreStatus =
  "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted [.room-card-explore[data-live=true]_&]:text-foreground [&_.signal-dot]:shadow-none";
export const roomCardExploreAudience =
  "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-muted [&_svg]:size-3.5";
export const roomCardExploreTitle =
  "font-display overflow-wrap-anywhere text-[1.0625rem] font-semibold leading-tight tracking-[-0.02em]";
export const roomCardExploreDesc =
  "m-0 line-clamp-2 text-sm leading-[1.55] text-muted";
export const roomCardExploreCta =
  "room-card-explore-cta mt-auto pt-1 text-[13px] font-semibold text-muted";

export const dashboardPanel = "p-0";
export const dashboardPanelNotice = "mx-[var(--bento-pad-x)] mb-0 mt-[var(--bento-pad-y)]";
export const dashboardWorkspace =
  "grid grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] border-t-0 max-[900px]:grid-cols-1";
export const dashboardWorkspaceMain =
  "px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] max-[900px]:border-b-0";

export const siteBentoCell =
  "border-t border-border bg-background px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] [&_.home-cell-code]:mb-3.5";
export const siteBentoCellTip =
  "[&>svg]:mb-2 [&>svg]:mt-3 [&>svg]:size-5 [&>svg]:text-muted [&_h3]:text-[0.9375rem] [&_h3]:font-semibold [&_h3]:tracking-[-0.01em] [&_p]:mt-2.5 [&_p]:max-w-[22rem] [&_p]:text-[0.8125rem] [&_p]:leading-[1.65] [&_p]:text-muted";

export const siteErrorLayout =
  "grid min-h-[clamp(320px,44vh,480px)] grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-[clamp(24px,5vw,60px)] px-[clamp(20px,3vw,28px)] py-[clamp(32px,6vw,64px)] max-[900px]:grid-cols-1";

export const siteRoomGate =
  "max-w-[32rem] px-[clamp(20px,3vw,28px)] py-[clamp(22px,3vw,28px)]";
export const siteRoomGateForm = "max-w-full";

export const authShell =
  "auth-shell grid min-h-[clamp(440px,52vh,520px)] w-full grid-cols-2 overflow-hidden rounded-none border-0 bg-background max-[900px]:grid-cols-1 max-[600px]:my-8 flex max-[600px]:min-h-0 max-[600px]:flex-col max-[600px]:mb-12";
export const authArt =
  "auth-art relative flex min-h-0 flex-col justify-end overflow-hidden border-r border-border bg-background p-[clamp(24px,3.5vw,36px)] max-[900px]:min-h-[280px] max-[900px]:border-b max-[900px]:border-r-0 max-[600px]:min-h-[220px] max-[600px]:p-6";
export const authArtContent =
  "relative flex min-h-0 w-full flex-1 flex-col justify-end";
export const authArtCardWrap =
  "auth-art-card-wrap mb-0 w-full max-h-[min(52vh,420px)] shrink-0 perspective-[900px]";
export const authArtCard =
  "auth-art-card relative overflow-hidden rounded-none border border-border bg-input shadow-[inset_0_1px_0_rgb(255_255_255/4%)] will-change-transform [transform-style:preserve-3d] transition-[border-color,box-shadow] duration-300 data-[hover]:border-[color-mix(in_oklab,var(--color-muted)_35%,var(--color-border))] data-[hover]:shadow-[inset_0_1px_0_rgb(255_255_255/5%),0_20px_40px_rgb(0_0_0/35%)]";
export const authArtCardImage =
  "auth-art-card-image block h-auto max-h-[min(52vh,420px)] w-full select-none object-cover object-[55%_42%] [-webkit-user-drag:none]";
export const authArtCardImageGif =
  "max-h-[min(48vh,380px)] object-cover object-center";
export const authArtCardShine =
  "auth-art-card-shine pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 [[data-hover=true]_&]:opacity-100";
export const authArtCardEdge =
  "pointer-events-none absolute inset-0 z-[2] rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/6%)]";
export const authArtTitle =
  "mt-6 font-display text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.15] tracking-[-0.03em]";
export const authArtNote =
  "mt-4 max-w-[280px] text-sm leading-relaxed text-muted max-[600px]:mt-3 max-[600px]:max-w-[270px] max-[600px]:text-[11px]";
export const authContent =
  "flex flex-col justify-center bg-background p-[clamp(28px,4vw,40px)] max-[800px]:p-8 max-[600px]:px-6 max-[600px]:py-7";
export const authTitle =
  "font-display text-[clamp(1.65rem,3vw,2rem)] font-bold leading-[1.18] tracking-[-0.03em] pb-[0.04em] max-[600px]:text-[42px]";
export const authDescription =
  "mt-2.5 text-sm leading-relaxed text-muted [&_.text-link]:text-[inherit]";
export const authForm =
  "mt-[30px] grid gap-5 max-[600px]:mt-[26px] [&>button]:mt-1 [&>div]:min-w-0 [&_label]:text-xs [&_label]:font-medium [&_.field-error]:mt-2";
export const authKicker =
  "text-[11px] uppercase tracking-[0.07em] text-accent";
export const errorCode =
  "font-display text-[clamp(8rem,22vw,16rem)] font-extrabold leading-[0.9] tracking-[-0.055em] text-[color-mix(in_oklab,var(--color-foreground)_18%,transparent)] max-[600px]:text-[11rem]";
export const errorCopy =
  "[&_.home-cell-code]:mb-3.5 [&_.action-link]:mt-7 [&_h1]:font-display [&_h1]:text-[clamp(2rem,4.5vw,3.25rem)] [&_h1]:font-bold [&_h1]:leading-[0.98] [&_h1]:tracking-[-0.035em] [&_p]:mt-[22px] [&_p]:max-w-[320px] [&_p]:text-[15px] [&_p]:text-muted";

export const focusProfileIdentity =
  "mb-[22px] flex items-center gap-4 border-b border-border pb-5";
export const focusProfileName =
  "text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.02em]";
export const focusProfileEmail =
  "mt-1.5 break-all text-[0.8125rem] leading-normal text-muted";
