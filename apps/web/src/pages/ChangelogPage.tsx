import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import { SitePageHead } from "@/components/layout/SitePageHead";
import changelogsDoc from "@/data/changelogs.json";
import type {
  ChangelogDocument,
  ChangelogSectionType,
} from "@/features/changelog/changelogTypes";
import {
  homeBentoPanel,
  homeCellCode,
  sitePanel,
} from "@/ui";

const document = changelogsDoc as ChangelogDocument;

const sectionBadge: Record<ChangelogSectionType, string> = {
  fix: "bg-[color-mix(in_srgb,var(--destructive)_18%,transparent)] text-[var(--destructive)]",
  improvement: "bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] text-foreground",
  security: "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--accent)]",
};

function formatReleaseDate(iso: string, locale: string): string {
  const parsed = Date.parse(`${iso}T12:00:00`);
  if (Number.isNaN(parsed)) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function ChangelogPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("pt")
    ? "pt-BR"
    : i18n.language.startsWith("ru")
      ? "ru"
      : i18n.language.startsWith("es")
        ? "es"
        : "en";

  const releases = useMemo(
    () =>
      [...document.releases].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const sectionLabel = (type: ChangelogSectionType) =>
    t(`changelog.section.${type}`);

  return (
    <SiteCatalogShell>
      <SitePageHead
        code="CL-LOG"
        wideTitle
        title={t("changelog.title")}
        description={t("changelog.description")}
      />

      <div className="mt-10 flex flex-col gap-10">
        {releases.map((release) => (
          <article
            key={release.id}
            className={cn(homeBentoPanel, sitePanel, "py-8 md:py-10")}
          >
            <header className="mb-6 border-b border-border pb-6">
              <span className={cn(homeCellCode, "mb-2 block")}>
                {release.id}
              </span>
              <h2 className="text-[1.35rem] font-semibold leading-tight tracking-tight text-foreground md:text-[1.5rem]">
                {release.title}
              </h2>
              <time
                dateTime={release.date}
                className="mt-2 block text-[0.8125rem] text-muted"
              >
                {formatReleaseDate(release.date, locale)}
              </time>
            </header>

            <div className="grid gap-8">
              {release.sections.map((section) => (
                <section key={`${release.id}-${section.type}`}>
                  <h3 className="mb-3 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em]">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5",
                        sectionBadge[section.type],
                      )}
                    >
                      {sectionLabel(section.type)}
                    </span>
                  </h3>
                  <ul className="grid gap-2.5 text-[0.9375rem] leading-[1.65] text-muted">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="relative pl-5 before:absolute before:left-0 before:top-[0.65em] before:size-1.5 before:rounded-full before:bg-border"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SiteCatalogShell>
  );
}
