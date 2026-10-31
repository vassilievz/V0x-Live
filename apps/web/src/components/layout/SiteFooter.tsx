import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DotField } from "@/components/background/DotField";
import { cn } from "@/lib/cn";
import {
  brandLink,
  brandName,
  footerBottom,
  footerDescription,
  footerLinks,
  footerMain,
  homeBento,
  signalDot,
  signalLabel,
  siteFooter,
  siteFooterDotfield,
  siteFooterPanel,
} from "@/ui";

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={cn(siteFooter, className)}>
      <div className="site-container max-w-full">
        <DotField
          className={cn(homeBento, siteFooterDotfield)}
          spacing={14}
          seed={11}
          interactive
        >
          <div className={siteFooterPanel}>
            <div className={footerMain}>
              <div>
                <Link to="/" className={brandLink} aria-label={t("common.brandHome")}>
                  <BrandLogo size="sm" layoutId="v0x-logo-footer" pulse={false} />
                  <span className={brandName} aria-hidden="true">
                    V0x <span>Live</span>
                  </span>
                </Link>
                <p className={footerDescription}>{t("footer.description")}</p>
              </div>
              <nav className={footerLinks} aria-label={t("footer.aria")}>
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
            <div className={footerBottom}>
              <p>{t("footer.copyright", { year })}</p>
              <span className={signalLabel}>
                <span className={signalDot} /> {t("footer.tagline")}
              </span>
            </div>
          </div>
        </DotField>
      </div>
    </footer>
  );
}
