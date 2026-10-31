import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <SiteCatalogShell>
      <section className="home-bento-panel site-panel site-panel--flush">
        <div className="site-error-layout">
          <p className="error-code" aria-hidden="true">
            404
          </p>
          <div className="error-copy">
            <span className="home-cell-code">ER-404</span>
            <h1>
              {t("notFound.titleLine1")}
              <br />
              {t("notFound.titleLine2")}
            </h1>
            <p>{t("notFound.body")}</p>
            <Link to="/" className="action-link action-link--pill">
              {t("notFound.backHome")} <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </SiteCatalogShell>
  );
}
