export const LOCALE_STORAGE_KEY = "v0x-locale";

export const supportedLocales = ["en", "pt", "ru", "es"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const localeMeta: Record<AppLocale, { shortLabel: string }> = {
  en: { shortLabel: "EN" },
  pt: { shortLabel: "PT" },
  ru: { shortLabel: "RU" },
  es: { shortLabel: "ES" },
};

export function isAppLocale(value: string): value is AppLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

export function localeToHtmlLang(locale: AppLocale): string {
  switch (locale) {
    case "pt":
      return "pt-BR";
    case "en":
      return "en";
    case "ru":
      return "ru";
    case "es":
      return "es";
    default: {
      const exhaustive: never = locale;
      return exhaustive;
    }
  }
}

export function resolveInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "pt";
  }
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isAppLocale(stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("pt")) {
    return "pt";
  }
  if (nav.startsWith("ru")) {
    return "ru";
  }
  if (nav.startsWith("es")) {
    return "es";
  }
  if (nav.startsWith("en")) {
    return "en";
  }
  return "pt";
}
