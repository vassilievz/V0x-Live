import type { ReactNode } from "react";
import { useBentoMeta, type BentoMetaPreset } from "@/i18n/bentoMeta";

type BentoShellProps = {
  meta?: readonly string[];
  metaPreset?: BentoMetaPreset;
  /** Barra meta de 4 colunas — só na landing. */
  showMetaBar?: boolean;
  children: ReactNode;
};

export function BentoShell({
  meta,
  metaPreset = "default",
  showMetaBar = false,
  children,
}: BentoShellProps) {
  const defaultMeta = useBentoMeta(metaPreset);
  const labels = meta ?? defaultMeta;

  return (
    <div className="home-page">
      <div className="site-container home-bento">
        {showMetaBar ? (
          <div className="home-meta-bar" aria-hidden="true">
            {labels.map((label, index) => (
              <span key={`${index}-${label}`}>{label}</span>
            ))}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
