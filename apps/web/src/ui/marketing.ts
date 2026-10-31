import { cn } from "@/lib/cn";
import {
  homeBentoPanel,
  homeCellCode,
  homeSectionHead,
  homeSectionTitle,
  sitePanelFlush,
} from "./shell";

/** Landing, footer, explore hero (Tailwind + effect hooks). */
export {
  homeBentoPanel,
  homeCellCode,
  homeSectionHead,
  homeSectionTitle,
  sitePanelFlush,
};

export const homeContentLock = "home-content-lock";

export const homeHero =
  "home-hero relative min-h-[clamp(520px,58vh,680px)] overflow-hidden bg-background";
export const homeHeroInner = "relative z-[3] h-full";
export const homeHeroGrid =
  "home-hero-grid grid min-h-[clamp(480px,54vh,640px)] grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] items-stretch bg-transparent max-[900px]:min-h-0 max-[900px]:grid-cols-1";
export const homeHeroCopy =
  "home-hero-copy relative z-[3] flex max-w-[40rem] flex-col justify-center p-[clamp(28px,4.5vw,52px)] max-[900px]:border-b max-[900px]:border-border";
export const homeHeroFormWrap =
  "home-hero-form-wrap relative z-[3] flex items-center p-[clamp(28px,4.5vw,52px)]";
export const homeKicker =
  "mb-[22px] flex flex-wrap items-center gap-x-3.5 gap-y-2.5 text-[11px] uppercase tracking-[0.08em] text-muted [&_.home-cell-code]:mb-0";
export const homeHeroTitle =
  "home-hero-title font-display max-w-[11ch] text-[clamp(2.6rem,5.8vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.04em]";
export const homeAccentWord = "text-accent";
export const homeLead =
  "home-lead mt-[22px] max-w-[34rem] text-[clamp(1rem,1.5vw,1.125rem)] leading-relaxed text-muted";
export const homeHeroLinks =
  "home-hero-links mt-[30px] flex flex-wrap items-center gap-x-[22px] gap-y-3.5";

export const homeOnlineNow =
  "home-online-now mb-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-[clamp(28px,4.5vw,52px)] py-3 text-[11px] uppercase tracking-[0.08em] text-muted max-[900px]:px-[clamp(28px,4.5vw,52px)] [&_.home-cell-code]:mb-0";

export const homeOnlinePulse =
  "home-online-pulse size-1.5 shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor]";

export const homeSteps = "bg-background";
export const homeStepList =
  "home-step-list m-0 grid list-none grid-cols-3 gap-0 border-t border-border p-0 max-[900px]:grid-cols-1";
export const homeStepCell =
  "home-step-cell relative min-w-0 overflow-hidden border-r border-border bg-background px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] transition-[background-color,border-color] duration-300 last:border-r-0 max-[900px]:border-b max-[900px]:border-r-0 max-[900px]:last:border-b-0 [&_.home-cell-code]:mb-4 [&_.home-cell-code]:mt-[0.12em] [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-[1.35] [&_h3]:tracking-[-0.015em] [&_p]:mt-2.5 [&_p]:max-w-[22rem] [&_p]:text-sm [&_p]:leading-[1.65] [&_p]:text-muted";
export const homeStepCellHalftone = "home-step-cell__halftone";
export const homeStepCellInner = "home-step-cell__inner";
export const homeStepNum =
  "mb-3.5 block font-display text-[clamp(2rem,4vw,2.75rem)] font-bold leading-none tracking-[-0.05em] text-disabled transition-colors duration-300";

export const homeHighlights = "bg-background";
export const homeHighlightGrid =
  "home-highlight-grid m-0 grid list-none grid-cols-3 gap-0 border-t border-border p-0 max-[900px]:grid-cols-1";
export const homeHighlightCell =
  "home-highlight-cell relative min-w-0 overflow-hidden border-r border-border bg-background px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] transition-[background-color,border-color] duration-300 last:border-r-0 max-[900px]:border-b max-[900px]:border-r-0 max-[900px]:last:border-b-0 [&_.home-cell-code]:mb-4 [&_.home-cell-code]:mt-[0.12em] [&_h3]:text-base [&_h3]:font-semibold [&_h3]:tracking-[-0.01em] [&_p]:mt-2.5 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted";
export const homeHighlightCellHalftone = "home-highlight-cell__halftone";
export const homeHighlightCellInner = "home-highlight-cell__inner";

export const homeAbout = "bg-background";
export const homeAboutLayout =
  "home-about-layout grid min-h-[clamp(380px,44vw,520px)] grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-stretch gap-0 border-t border-border max-[900px]:min-h-0 max-[900px]:grid-cols-1";
export const homeAboutCopy =
  "home-about-copy flex max-w-[40rem] flex-col justify-center border-r border-border px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] max-[900px]:border-b max-[900px]:border-r-0 [&_.home-cell-code]:mb-4 [&_.action-link]:mt-6";
export const homeAboutText =
  "mt-[18px] max-w-[40rem] text-[0.9375rem] leading-[1.7] text-muted";
export const homeAboutArt =
  "home-about-art relative h-full min-h-full w-full overflow-hidden bg-background max-[900px]:h-auto max-[900px]:min-h-[clamp(320px,62vw,440px)]";
export const homeAboutArtImage =
  "absolute inset-0 block h-full w-full object-cover object-[center_32%]";
export const homeAboutArtImageGif =
  "home-about-art-image--gif media-gif-about absolute inset-0 block h-full w-full bg-black object-cover object-center";

export const homeFaq = "bg-background";
export const homeFaqList = "home-faq-list border-t border-border";
export const homeFaqItem = "home-faq-item border-b border-border";
export const homeFaqBody = "home-faq-body";

export const homeCreateCard =
  "home-create-card relative z-[1] grid w-full gap-0 rounded-lg border border-border bg-[rgb(0_0_0/0.72)] p-[clamp(22px,3vw,28px)]";
export const homeCreateLabel =
  "mb-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted";
export const homeCreateTitle =
  "mb-[18px] font-display text-[1.35rem] font-bold tracking-[-0.02em]";
export const homeCreateSubmit = "mt-4 w-full rounded-full";
export const homeCreateFoot =
  "mt-4 flex flex-wrap justify-between gap-x-4 gap-y-2 text-xs text-muted [&_label]:mb-2 [&_label]:block [&_label]:text-[0.8125rem] [&_label]:text-muted";

export const crtArt = "crt-art isolate overflow-hidden rounded-lg";
export const crtArtHero = "crt-art crt-art--hero h-full w-full rounded-none";
export const crtArtCompact = "crt-art crt-art--compact rounded-xl";
export const crtArtGlyph = "crt-art crt-art--glyph";
export const crtArtLayer = "crt-art__layer relative z-[1] h-full w-full";
export const crtArtLayerRgb = "crt-art__layer crt-art__layer--rgb mix-blend-lighten";
export const crtArtScanlines = "crt-art__scanlines";
export const crtArtVignette = "crt-art__vignette";
export const crtArtParticles = "crt-art__particles";

export const homeHeroArt =
  "home-hero-art pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden bg-background";
export const homeHeroArtImage =
  "home-hero-art-image block h-full min-h-full min-w-full w-full object-cover object-[center_30%] max-[900px]:object-[center_26%]";
export const homeHeroArtGrain =
  "home-hero-art-grain pointer-events-none absolute inset-0 z-[2] h-full w-full opacity-0 transition-opacity duration-600";

export const siteFooter =
  "overflow-x-clip bg-background py-0 pb-[clamp(32px,5vw,48px)] max-w-full [&_.site-container]:max-w-full";
export const siteFooterDotfield =
  "site-footer-dotfield home-bento isolate min-h-0 max-w-full overflow-hidden border-t border-border bg-background shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_6%,transparent)]";
export const siteFooterPanel =
  "site-footer-panel relative z-[1] px-[clamp(20px,3vw,28px)] py-[clamp(28px,4vw,36px)] pb-[clamp(22px,3vw,28px)]";
export const footerMain =
  "flex flex-wrap justify-between gap-[50px] max-[600px]:flex-col max-[600px]:gap-8";
export const footerDescription =
  "site-footer-dotfield:text-[color-mix(in_oklab,var(--color-foreground)_86%,var(--color-muted))] mt-3 max-w-[280px] text-[13px] leading-relaxed text-muted";
export const footerLinks =
  "flex flex-wrap gap-[55px] max-[800px]:gap-8 max-[600px]:gap-[70px] [&>div]:grid [&>div]:content-start [&>div]:gap-2.5 [&_a]:py-[3px] [&_a]:text-xs [&_a]:transition-colors [&_a:hover]:text-foreground [&_a:hover]:underline [&_a:hover]:underline-offset-4 [&_p]:mb-1 [&_p]:font-mono [&_p]:text-[10px] [&_p]:uppercase [&_p]:tracking-[0.08em] [&_p]:text-muted site-footer-dotfield:[&_a]:text-[color-mix(in_oklab,var(--color-foreground)_92%,var(--color-muted))] site-footer-dotfield:[&_p]:text-[color-mix(in_oklab,var(--color-foreground)_62%,var(--color-muted))]";
export const footerBottom =
  "site-footer-dotfield:text-[color-mix(in_oklab,var(--color-foreground)_78%,var(--color-muted))] mt-[34px] flex flex-wrap items-center justify-between gap-5 border-t border-border pt-[22px] text-[11px] text-muted max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2.5 site-footer-dotfield:[&_.signal-label]:text-[color-mix(in_oklab,var(--color-foreground)_88%,var(--color-muted))]";

export const dotField =
  "dot-field relative w-full overflow-hidden bg-background text-[color-mix(in_oklab,var(--color-muted)_70%,var(--color-border))]";
export const dotFieldCanvasWrap = "dot-field__canvas-wrap pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]";
export const dotFieldCanvas =
  "dot-field__canvas h-full w-full opacity-0 transition-opacity duration-500 site-footer-dotfield:max-w-full site-footer-dotfield:mask-none site-footer-dotfield:text-[color-mix(in_oklab,var(--color-border)_65%,var(--color-muted))]";
export const dotFieldContent =
  "dot-field__content relative z-[1] w-full site-footer-dotfield:text-foreground site-footer-dotfield:before:pointer-events-none site-footer-dotfield:before:absolute site-footer-dotfield:before:inset-0 site-footer-dotfield:before:z-0 site-footer-dotfield:before:bg-[radial-gradient(ellipse_95%_85%_at_50%_45%,rgb(0_0_0/0.72)_0%,rgb(0_0_0/0.35)_55%,transparent_100%)]";

export const exploreRoomsHero = cn(
  homeBentoPanel,
  sitePanelFlush,
  "explore-rooms-hero relative grid min-h-[clamp(268px,34vw,400px)] grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)] items-stretch bg-background max-[900px]:min-h-0 max-[900px]:grid-cols-1",
);
export const exploreRoomsHeroStage =
  "explore-rooms-hero__stage signal-media-stage relative isolate overflow-hidden border-l border-border bg-black max-[900px]:order-[-1] max-[900px]:min-h-[clamp(200px,42vw,280px)] max-[900px]:border-b max-[900px]:border-l-0";
export const exploreRoomsHeroGif =
  "explore-rooms-hero__gif media-gif-screen absolute inset-0 block h-full w-full scale-[1.06] object-cover object-center will-change-transform";
export const exploreRoomsHeroGrain = "explore-rooms-hero__grain media-gif-grain-explore";
export const exploreRoomsHeroVeil = "explore-rooms-hero__veil media-gif-veil-explore";
export const exploreRoomsHeroFrame = "explore-rooms-hero__frame signal-media-frame";
export const exploreRoomsHeroFrameLabel = "signal-media-frame-label";
export const exploreRoomsHeroContent =
  "explore-rooms-hero__content relative z-[2] flex items-end bg-background px-[var(--bento-pad-x)] py-[var(--bento-pad-y)] max-[900px]:items-start [&_[data-page-lead]]:text-[color-mix(in_oklab,var(--color-foreground)_58%,var(--color-muted))] [&_[data-site-page-head]]:w-full";

export const dashboardCreateVisual = "block min-w-0";
export const dashboardCreateVisualStage =
  "dashboard-create-visual__stage signal-media-stage relative isolate h-full min-h-[clamp(440px,52vh,620px)] overflow-hidden bg-black max-[900px]:min-h-[clamp(220px,44vw,320px)] max-[900px]:border-t max-[900px]:border-border";
export const dashboardCreateVisualGif =
  "dashboard-create-visual__gif media-gif-screen absolute inset-0 block h-full w-full scale-105 object-cover object-center";
export const dashboardCreateVisualGrain = "dashboard-create-visual__grain media-gif-grain-dashboard";
export const dashboardCreateVisualVeil = "dashboard-create-visual__veil media-gif-veil-dashboard";
export const dashboardCreateVisualFrame = "dashboard-create-visual__frame signal-media-frame";
export const dashboardCreateVisualFrameLabel = "signal-media-frame-label";
