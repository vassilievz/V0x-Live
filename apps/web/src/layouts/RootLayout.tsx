import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { pageTransition } from "@/motion/presets";
import { useHomeContentLock } from "@/hooks/useHomeContentLock";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";

const ROUTE_META_KEYS: Record<string, "home" | "dashboard" | "rooms"> = {
  "/": "home",
  "/dashboard": "dashboard",
  "/rooms": "rooms",
};

export function RootLayout() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const { t, i18n } = useTranslation();
  const isHome = location.pathname === "/";
  const isRoomStage = location.pathname.startsWith("/room/");
  useHomeContentLock(isHome);
  useEnsureGuestSession();

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest(
        ".hover-surface--btn-primary",
      );
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const rect = target.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        return;
      }
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty("--hx", `${x}%`);
      target.style.setProperty("--hy", `${y}%`);
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const metaKey = ROUTE_META_KEYS[location.pathname] ?? "notFound";
    document.title = `${t("meta.siteTitle")} | ${t(`meta.${metaKey}`)}`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, t, i18n.language]);

  return (
    <div className={`flex min-h-dvh flex-col${isRoomStage ? " room-app-root" : ""}`}>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        {t("common.skipToContent")}
      </a>
      {!isRoomStage ? (
        <SiteHeader />
      ) : null}
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className={
          isRoomStage
            ? "flex min-h-0 flex-1 flex-col"
            : isHome
              ? "home-content-lock flex-1"
              : "flex-1"
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className={isRoomStage ? "room-stage-outlet" : undefined}
            {...pageTransition}
            initial={reduced ? false : pageTransition.initial}
            transition={reduced ? { duration: 0 } : pageTransition.transition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isRoomStage ? (
        <SiteFooter className={isHome ? "home-content-lock" : undefined} />
      ) : null}
    </div>
  );
}
