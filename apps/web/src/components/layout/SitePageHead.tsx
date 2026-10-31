import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { homeCellCode, homeSectionTitle } from "@/ui";

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
    <div
      data-site-page-head
      className="flex flex-wrap items-end justify-between gap-6 pb-[0.12em] max-[900px]:flex-col max-[900px]:items-start"
    >
      <div className="max-w-[40rem]">
        <span className={cn(homeCellCode, "mb-3 block")}>{code}</span>
        <h1
          className={cn(
            homeSectionTitle,
            wideTitle ? "max-w-none" : "max-w-[16ch]",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            data-page-lead
            className="mt-4 max-w-xl text-[0.9375rem] leading-[1.65] text-muted"
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-end gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
