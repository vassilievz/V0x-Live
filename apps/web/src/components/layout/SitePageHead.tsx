import type { ReactNode } from "react";

type SitePageHeadProps = {
  code: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Títulos longos (dashboard, perfil) — sem limite de 16ch. */
  wideTitle?: boolean;
};

export function SitePageHead({ code, title, description, actions, wideTitle }: SitePageHeadProps) {
  return (
    <div className={wideTitle ? "site-page-head site-page-head--wide" : "site-page-head"}>
      <div className="site-page-head-main">
        <span className="home-cell-code">{code}</span>
        <h1 className="home-section-title">{title}</h1>
        {description ? <p className="site-page-lead">{description}</p> : null}
      </div>
      {actions ? <div className="site-page-head-actions">{actions}</div> : null}
    </div>
  );
}
