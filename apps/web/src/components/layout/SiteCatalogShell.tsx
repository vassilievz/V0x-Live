import type { ReactNode } from "react";

type SiteCatalogShellProps = {
  children: ReactNode;
};

/** Páginas internas: mesmo contentor bento da home, sem barra meta de 4 colunas. */
export function SiteCatalogShell({ children }: SiteCatalogShellProps) {
  return (
    <div className="home-page">
      <div className="site-container home-bento">{children}</div>
    </div>
  );
}
