import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import changelogsDoc from "@/data/changelogs.json";
import type { ChangelogDocument } from "@/features/changelog/changelogTypes";
import {
  changelogLocale,
  changelogSectionTone,
  formatChangelogDate,
  formatChangelogVersion,
} from "@/features/changelog/changelogFormat";
import { cn } from "@/lib/cn";
import {
  changelogDialogBackdrop,
  changelogDialogClose,
  changelogDialogPanel,
  changelogDialogScroll,
  changelogItem,
  changelogItemList,
  changelogReleaseDate,
  changelogReleaseTitle,
  changelogSectionBadge,
  changelogTimeline,
  changelogTimelineDot,
  changelogVersionTag,
} from "@/ui";

const changelogDocument = changelogsDoc as ChangelogDocument;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChangelogModal({ open, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const locale = changelogLocale(i18n.language);

  const releases = useMemo(
    () =>
      [...changelogDocument.releases].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className={changelogDialogBackdrop}
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className={changelogDialogPanel}
        role="dialog"
        aria-modal="true"
        aria-label={t("changelog.title")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={changelogDialogClose}
          onClick={onClose}
          aria-label={t("changelog.close")}
        >
          <X className="size-[18px]" aria-hidden="true" />
        </button>

        <div className={changelogDialogScroll}>
          <div className={cn(changelogTimeline, "space-y-12 sm:space-y-14")}>
            {releases.map((release, index) => (
              <article key={release.id} className="relative">
                <span className={changelogTimelineDot} aria-hidden="true" />
                {index < releases.length - 1 ? (
                  <span
                    className="pointer-events-none absolute -left-px top-3 bottom-[-3rem] w-px bg-[color-mix(in_oklab,var(--destructive)_25%,var(--color-border))] sm:bottom-[-3.5rem]"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={changelogVersionTag}>
                    {formatChangelogVersion(release.id, release.version)}
                  </span>
                  <time
                    dateTime={release.date}
                    className={changelogReleaseDate}
                  >
                    {formatChangelogDate(release.date, locale)}
                  </time>
                </div>
                <h2 className={changelogReleaseTitle}>{release.title}</h2>

                {release.sections.map((section) => (
                  <section key={`${release.id}-${section.type}`}>
                    <span
                      className={cn(
                        changelogSectionBadge,
                        changelogSectionTone[section.type],
                      )}
                    >
                      {t(`changelog.section.${section.type}`)}
                    </span>
                    <ul className={changelogItemList}>
                      {section.items.map((item) => (
                        <li key={item} className={changelogItem}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
