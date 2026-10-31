import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DotField } from "@/components/background/DotField";

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const footerClass = className ? `site-footer ${className}` : "site-footer";

  return (
    <footer className={footerClass}>
      <div className="site-container">
        <DotField
          className="home-bento site-footer-dotfield"
          spacing={14}
          seed={11}
          interactive
        >
          <div className="home-bento-panel site-footer-panel">
            <div className="footer-main">
              <div>
                <Link to="/" className="brand-link" aria-label={t("common.brandHome")}>
                  <BrandLogo size="sm" layoutId="v0x-logo-footer" pulse={false} />
                  <span className="brand-name" aria-hidden="true">
                    V0x <span>Live</span>
                  </span>
                </Link>
                <p className="footer-description">{t("footer.description")}</p>
              </div>
              <nav className="footer-links" aria-label={t("footer.aria")}>
                <div>
                  <p>{t("footer.findGroup")}</p>
                  <Link to="/rooms">{t("nav.exploreRooms")}</Link>
                  <Link to="/dashboard">{t("footer.createRoom")}</Link>
                </div>
                <div>
                  <p>{t("footer.yourSpace")}</p>
                  <Link to="/dashboard">{t("footer.createRoom")}</Link>
                </div>
              </nav>
            </div>
            <div className="footer-bottom">
              <p>{t("footer.copyright", { year })}</p>
              <span className="signal-label">
                <span className="signal-dot" /> {t("footer.tagline")}
              </span>
            </div>
          </div>
        </DotField>
      </div>
    </footer>
  );
}
