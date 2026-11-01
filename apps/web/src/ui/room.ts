import { cn } from "@/lib/cn";
import { homeCellCode } from "./shell";

/** Room stage, chat, music (Tailwind). */
export const roomAppRoot =
  "room-app-root h-dvh max-h-dvh overflow-hidden [&_#conteudo-principal]:min-h-0 [&_#conteudo-principal]:flex-1 [&_#conteudo-principal]:overflow-hidden";
export const roomStageOutlet =
  "room-stage-outlet flex h-full min-h-0 flex-1 flex-col";

export const roomStageShell =
  "grid h-dvh min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#070707] text-foreground";
export const roomStageHeader =
  "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[rgb(255_255_255/10%)] bg-[rgb(6_6_6/94%)] px-[clamp(14px,3vw,24px)] py-3 backdrop-blur-md";
export const roomStageHeaderBrand =
  "flex min-w-0 flex-[1_1_12rem] items-start gap-2.5";
export const roomStageHeaderCopy = "min-w-0";
export const roomStageBack =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-[rgb(255_255_255/12%)] text-muted transition-[color,background-color,border-color] duration-150 hover:border-[rgb(255_255_255/22%)] hover:bg-[rgb(255_255_255/6%)] hover:text-foreground";
export const roomStageCode = cn(homeCellCode, "mb-1 block text-[10px] tracking-[0.12em]");
export const roomStageTitle =
  "truncate font-display text-[clamp(1.05rem,2.5vw,1.3rem)] font-[650] leading-tight tracking-[-0.03em]";
export const roomStageStatus =
  "mt-1 inline-flex items-center gap-2 text-[11px] tracking-[0.02em] text-muted";
export const roomStageStatusLive = "room-stage-status--live [&_.room-stage-status-dot]:bg-foreground [&_.room-stage-status-dot]:shadow-[0_0_0_3px_rgb(245_245_245/10%)]";
export const roomStageStatusDot =
  "room-stage-status-dot size-1.5 rounded-full bg-[rgb(255_255_255/28%)]";
export const roomStageHeaderActions =
  "flex flex-wrap items-center justify-end gap-2";
export const roomStageRailToggle =
  "room-stage-rail-toggle inline-flex min-h-11 items-center gap-2 lg:hidden";
export const roomStageActionBtn = "room-stage-action-btn min-h-11 min-w-11";

export const roomStageBody = "relative min-h-0 overflow-hidden";
export const roomStageWorkspace =
  "grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)] [grid-template-areas:'stage'] lg:grid-cols-[minmax(0,1fr)_min(360px,32vw)] lg:[grid-template-areas:'stage_rail'] lg:gap-px lg:bg-[rgb(255_255_255/10%)]";
export const roomStageMain =
  "flex h-full min-h-0 min-w-0 flex-col bg-[#070707] p-[clamp(10px,2vw,18px)] [grid-area:stage]";
export const roomStageMainFill =
  "flex min-h-0 flex-1 flex-col gap-2.5 [&>.room-stage-broadcast]:min-h-0 [&>.room-stage-broadcast]:flex-1 [&>.room-stage-placeholder]:min-h-0 [&>.room-stage-placeholder]:flex-1";
export const roomStageBroadcast =
  "room-stage-broadcast flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[rgb(255_255_255/12%)] bg-black shadow-[inset_0_0_0_1px_rgb(255_255_255/5%)]";
export const roomStageAlert =
  "mb-2.5 rounded-xl border border-[color-mix(in_oklab,var(--color-danger)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] px-3 py-2.5 text-sm text-danger";
export const roomStagePlaceholder =
  "flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3.5 rounded-2xl border border-[rgb(255_255_255/10%)] bg-[rgb(255_255_255/2%)] p-7 text-center text-sm text-muted";
export const roomStagePlaceholderMuted =
  "room-stage-placeholder--muted border-solid bg-[rgb(255_255_255/3%)]";
export const roomStageBackdrop =
  "room-stage-backdrop fixed inset-0 z-40 cursor-pointer border-0 bg-[rgb(0_0_0/55%)] backdrop-blur-[2px] lg:hidden";

export function roomStageRail(open?: boolean) {
  return cn(
    "room-stage-rail pointer-events-none invisible fixed inset-x-0 bottom-0 z-50 flex h-[min(78dvh,640px)] min-h-0 translate-y-[105%] flex-col rounded-t-[20px] border border-b-0 border-[rgb(255_255_255/12%)] bg-[#0c0c0c] shadow-[0_-20px_60px_rgb(0_0_0/55%)] transition-[transform,visibility] duration-[280ms] [grid-area:stage] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] lg:pointer-events-auto lg:visible lg:relative lg:z-0 lg:h-full lg:max-h-none lg:translate-none lg:rounded-none lg:border-0 lg:bg-[#0a0a0a] lg:shadow-none lg:[grid-area:rail]",
    open &&
      "room-stage-rail--open pointer-events-auto visible translate-none transition-delay-0",
  );
}

export const roomStageRailHandle =
  "mx-auto mb-1 mt-2.5 h-1 w-10 rounded-full bg-[rgb(255_255_255/18%)] lg:hidden";
export const roomStageRailTabs =
  "grid grid-cols-2 gap-1.5 border-b border-[rgb(255_255_255/8%)] px-3 pb-2.5 pt-2";
export const roomStageRailPanel =
  "flex min-h-0 flex-1 flex-col overflow-hidden";

export const roomStageTab =
  "room-stage-tab inline-flex w-full min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-transparent px-3 text-[13px] font-medium text-muted transition-[color,background-color,border-color] duration-150 hover:border-[rgb(255_255_255/8%)] hover:bg-[rgb(255_255_255/4%)] hover:text-foreground";
export const roomStageTabActive =
  "room-stage-tab--active border-[rgb(255_255_255/20%)] bg-foreground text-background";

export const roomPanel = "flex h-full min-h-0 flex-col";
export const roomPanelEmbedded = "min-h-0";
export const roomPanelHeading =
  "border-b border-[rgb(255_255_255/8%)] px-4 py-3.5 text-[13px] font-semibold tracking-[0.02em]";

export const roomChatMessages =
  "m-0 flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto px-3.5 py-3";
export const roomChatMessage =
  "rounded-xl border border-[rgb(255_255_255/8%)] bg-[rgb(255_255_255/3%)] px-3 py-2.5 text-sm";
export const roomChatAuthor =
  "mb-1 block text-xs font-semibold tracking-[0.02em] text-muted";
export const roomChatBody =
  "m-0 overflow-wrap-anywhere leading-normal text-foreground";
export const roomChatComposer =
  "flex gap-2 border-t border-[rgb(255_255_255/10%)] bg-[rgb(0_0_0/35%)] px-3 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] [&_input]:min-h-11 [&_input]:rounded-xl";

export const roomChatSystem =
  "grid list-none gap-1.5 rounded-xl border border-dashed border-[rgb(255_255_255/14%)] bg-[rgb(255_255_255/2%)] px-3.5 py-3";
export const roomChatSystemBadge =
  "inline-flex w-fit rounded-full border border-border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted";
export const roomChatSystemBody = "text-[13px] leading-snug text-foreground";

export const roomParticipantList =
  "m-0 flex-1 list-none overflow-y-auto px-2.5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-2";
export const roomParticipantRow =
  "flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-2.5 transition-[background-color,border-color,box-shadow] duration-150 hover:border-[rgb(255_255_255/6%)] hover:bg-[rgb(255_255_255/4%)]";
export const roomParticipantSpeaking =
  "ring-1 ring-[rgb(255_255_255/55%)] shadow-[0_0_0_1px_rgb(255_255_255/20%),0_0_18px_rgb(255_255_255/12%)] animate-pulse";
export const roomParticipantAvatar = "shrink-0";
export const roomParticipantMain = "min-w-0 flex-1";
export const roomParticipantHead =
  "flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5";
export const roomParticipantName =
  "truncate text-sm font-semibold";
export const roomParticipantRole =
  "text-[10px] font-semibold uppercase tracking-[0.06em] text-muted";
export const roomParticipantRoleHost = "text-foreground";
export const roomParticipantMedia =
  "mt-1 inline-flex gap-2 text-muted";
export const roomParticipantActions =
  "flex shrink-0 flex-wrap justify-end gap-1 max-[480px]:w-full max-[480px]:pl-[42px] max-[480px]:pt-1.5";
export const roomParticipantIconBtn =
  "room-participant-icon-btn !min-h-10 !min-w-10 !p-0";
export const roomParticipantEmpty =
  "px-3 py-6 text-center text-[13px] text-muted";

export const roomMusicDialogBackdrop =
  "fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-[rgb(0_0_0/82%)] p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:p-[var(--gutter)] sm:pb-[var(--gutter)]";
export const roomMusicDialog =
  "room-music-dialog m-0 w-full max-w-[480px] max-h-[min(88dvh,720px)] overflow-y-auto overscroll-contain scroll-pt-4 rounded-t-[20px] rounded-b-none sm:max-h-[min(92dvh,720px)] sm:rounded-lg sm:shadow-none shadow-[0_-24px_80px_rgb(0_0_0/55%)]";
export const roomMusicDialogVisibility =
  "grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3";
export const roomMusicDialogHead =
  "mb-1 flex items-center justify-between gap-3";
export const roomMusicDialogTitle =
  "flex items-center gap-2.5 text-[1.0625rem] font-semibold leading-[1.35] tracking-[-0.02em] text-foreground";
export const roomMusicDialogClose =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted transition-[color,background-color,border-color] duration-[180ms] hover:border-muted hover:bg-surface-muted hover:text-foreground";

export const roomCineDialog =
  "room-music-dialog room-cine-dialog m-0 w-full max-w-[min(100%,56rem)] max-h-[min(88dvh,820px)] overflow-y-auto overscroll-contain scroll-pt-4 rounded-t-[20px] rounded-b-none sm:max-h-[min(92dvh,820px)] sm:rounded-lg sm:shadow-none shadow-[0_-24px_80px_rgb(0_0_0/55%)]";

export const roomMusicPlayer =
  "relative border-t border-border bg-background px-[var(--bento-pad-x)] py-3.5";
export const roomMusicPlayerHead =
  "mb-3 flex items-center justify-between gap-2 border-b border-border pb-2.5";
export const roomMusicPlayerKicker =
  "inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted";
export const roomMusicPlayerClose =
  "inline-flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-muted hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35";
export const roomMusicPlayerBody =
  "mb-3 grid grid-cols-[56px_1fr] items-center gap-2.5";
export const roomMusicPlayerArt =
  "size-14 overflow-hidden rounded-lg border border-border bg-surface-muted [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover";
export const roomMusicPlayerTitle =
  "text-sm font-semibold leading-snug text-foreground";
export const roomMusicPlayerSub = "mt-1 text-xs text-muted";
export const roomMusicPlayerControls =
  "flex flex-wrap items-center gap-2";
export const roomMusicIconBtn =
  "room-music-icon-btn inline-flex size-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-[border-color,background-color] duration-[180ms] hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40";
export const roomMusicPlayBtn =
  "room-music-play-btn inline-flex size-11 items-center justify-center rounded-lg border border-border bg-accent text-accent-foreground transition-[border-color,background-color] duration-[180ms] hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40";
export const roomMusicVolume =
  "flex min-w-[120px] flex-1 items-center gap-2 text-muted [&_input]:w-full [&_input]:accent-foreground";
export const roomMusicPlayerFoot = "mt-2.5 text-[11px] text-muted";
export const roomMusicPlayerDirect = "mb-3 grid gap-2.5";
export const roomMusicPlayerVideo =
  "aspect-video w-full rounded-lg border border-border bg-black object-contain";
export const roomMusicSyncBtn =
  "w-fit rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-[border-color,background-color] duration-[180ms] hover:border-foreground";
export const roomMusicPlayerFrame =
  "room-music-player-frame absolute size-px overflow-hidden [clip:rect(0,0,0,0)]";

export const broadcastStageDirectShell =
  "broadcast-stage-direct absolute inset-0 overflow-hidden bg-black";
export const broadcastStageDirectVideo = "broadcast-stage-direct-video";
