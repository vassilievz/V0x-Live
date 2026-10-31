import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  localeToHtmlLang,
  resolveInitialLocale,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  isAppLocale,
} from "@/i18n/locales";
import { pt } from "@/i18n/resources/pt";
import { en } from "@/i18n/resources/en";
import { ru } from "@/i18n/resources/ru";
import { es } from "@/i18n/resources/es";

const initialLocale = resolveInitialLocale();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
    ru: { translation: ru },
    es: { translation: es },
  },
  lng: initialLocale,
  fallbackLng: "pt",
  supportedLngs: ["en", "pt", "ru", "es"],
  interpolation: { escapeValue: false },
});

function syncHtmlMeta(): void {
  const lng = i18n.language;
  if (isAppLocale(lng)) {
    document.documentElement.lang = localeToHtmlLang(lng);
  }
  const description = i18n.t("meta.htmlDescription");
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", description);
  }
}

if (typeof document !== "undefined") {
  syncHtmlMeta();
}

i18n.on("languageChanged", (lng) => {
  if (isAppLocale(lng)) {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    } catch {
      /* ignore */
    }
    syncHtmlMeta();
  }
});

export default i18n;

export function setAppLocale(locale: AppLocale): void {
  void i18n.changeLanguage(locale);
}
