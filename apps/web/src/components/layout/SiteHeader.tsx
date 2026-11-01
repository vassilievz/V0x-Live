import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { HeaderAccount } from "@/components/layout/HeaderAccount";
import { DiscordCommunityLink } from "@/components/layout/DiscordCommunityLink";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ChangelogModal } from "@/features/changelog/components/ChangelogModal";
import { useSessionUser } from "@/hooks/useSessionUser";
import { easeOut } from "@/motion/presets";
import { cn } from "@/lib/cn";
import {
  brandLink,
  brandName,
  headerActions,
  headerInner,
  headerNav,
  menuToggle,
  mobileNav,
  mobileNavSession,
  navLink,
  siteHeader,
} from "@/ui";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const location = useLocation();
  const reduced = useReducedMotion();
  const session = useSessionUser();
  const { t } = useTranslation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className={siteHeader} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <div className={cn("site-container", headerInner)}>
        <Link to="/" className={brandLink} aria-label={t("common.brandHome")}>
          <BrandLogo size="sm" pulse={false} />
          <span className={brandName} aria-hidden="true">
            V0x <span>Live</span>
          </span>
        </Link>
        <nav className={headerNav} aria-label={t("common.navPrimary")}>
          <NavLink to="/rooms" className={navLink}>
            {t("nav.exploreRooms")}
          </NavLink>
          <NavLink to="/dashboard" className={navLink}>
            {t("nav.mySpace")}
          </NavLink>
          <button
            type="button"
            className={cn(
              navLink,
              "cursor-pointer border-0 bg-transparent font-inherit",
            )}
            onClick={() => setChangelogOpen(true)}
          >
            {t("nav.changelog")}
          </button>
        </nav>
        <div className={headerActions}>
          <DiscordCommunityLink />
          <LanguageSelector />
          <HeaderAccount />
        </div>
        <button
          type="button"
          className={menuToggle}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? t("common.menuClose") : t("common.menuOpen")}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} /> : <Menu size={18} />} {t("common.menu")}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.nav
            id="mobile-navigation"
            className={mobileNav}
            aria-label={t("common.navMobile")}
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: easeOut }}
          >
            <NavLink to="/rooms" onClick={() => setOpen(false)}>
              {t("nav.exploreRooms")}
            </NavLink>
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>
              {t("nav.mySpaceCreate")}
            </NavLink>
            <button
              type="button"
              className="w-full border-0 border-b border-border bg-transparent py-3.5 text-left text-lg font-semibold tracking-[-0.01em] text-muted transition-[color,padding] hover:px-1 hover:text-foreground"
              onClick={() => {
                setOpen(false);
                setChangelogOpen(true);
              }}
            >
              {t("nav.changelog")}
            </button>
            {session.data ? (
              <span className={mobileNavSession}>{session.data.display_name}</span>
            ) : null}
            <DiscordCommunityLink variant="mobile" />
            <LanguageSelector variant="mobile" />
          </motion.nav>
        ) : null}
      </AnimatePresence>
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </header>
  );
}
