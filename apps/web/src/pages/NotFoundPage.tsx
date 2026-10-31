import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import {
  actionLink,
  actionLinkPill,
  errorCode,
  errorCopy,
  homeBentoPanel,
  homeCellCode,
  siteErrorLayout,
  sitePanelFlush,
} from "@/ui";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <SiteCatalogShell>
      <section className={cn(homeBentoPanel, sitePanelFlush)}>
        <div className={siteErrorLayout}>
          <p className={errorCode} aria-hidden="true">
            404
          </p>
          <div className={errorCopy}>
            <span className={homeCellCode}>ER-404</span>
            <h1>
              {t("notFound.titleLine1")}
              <br />
              {t("notFound.titleLine2")}
            </h1>
            <p>{t("notFound.body")}</p>
            <Link to="/" className={cn(actionLink, actionLinkPill)}>
              {t("notFound.backHome")} <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </SiteCatalogShell>
  );
}
