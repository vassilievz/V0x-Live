import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { HeaderAccount } from "@/components/layout/HeaderAccount";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useSessionUser } from "@/hooks/useSessionUser";
import { easeOut } from "@/motion/presets";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const reduced = useReducedMotion();
  const session = useSessionUser();
  const { t } = useTranslation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <div className="site-container header-inner">
        <Link to="/" className="brand-link" aria-label={t("common.brandHome")}>
          <BrandLogo size="sm" pulse={false} />
          <span className="brand-name" aria-hidden="true">
            V0x <span>Live</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label={t("common.navPrimary")}>
          <NavLink to="/rooms" className="nav-link">
            {t("nav.exploreRooms")}
          </NavLink>
          <NavLink to="/dashboard" className="nav-link">
            {t("nav.mySpace")}
          </NavLink>
        </nav>
        <div className="header-actions">
          <LanguageSelector />
          <HeaderAccount />
        </div>
        <button
          type="button"
          className="menu-toggle"
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
            className="mobile-nav"
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
            {session.data ? (
              <span className="mobile-nav-session">{session.data.display_name}</span>
            ) : null}
            <LanguageSelector variant="mobile" />
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
