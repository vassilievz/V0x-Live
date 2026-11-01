import type { ChangelogSectionType } from "@/features/changelog/changelogTypes";

export function changelogLocale(language: string): string {
  if (language.startsWith("pt")) return "pt-BR";
  if (language.startsWith("ru")) return "ru";
  if (language.startsWith("es")) return "es";
  return "en";
}

export function formatChangelogDate(iso: string, locale: string): string {
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

export function formatChangelogVersion(releaseId: string, version?: string): string {
  if (version?.trim()) {
    return version.startsWith("v") ? version : `v${version}`;
  }
  const parts = releaseId.split("-");
  if (parts.length === 3) {
    return `v${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return releaseId;
}

export const changelogSectionTone: Record<
  ChangelogSectionType,
  string
> = {
  fix: "bg-[color-mix(in_srgb,var(--destructive)_16%,transparent)] text-[var(--destructive)]",
  improvement:
    "bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] text-foreground",
  security:
    "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--accent)]",
};
