import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { homeBento, homePage } from "@/ui";

type SiteCatalogShellProps = {
  children: ReactNode;
};

/** Páginas internas: mesmo contentor bento da home, sem barra meta de 4 colunas. */
export function SiteCatalogShell({ children }: SiteCatalogShellProps) {
  return (
    <div className={homePage}>
      <div className={cn("site-container", homeBento)}>{children}</div>
    </div>
  );
}
