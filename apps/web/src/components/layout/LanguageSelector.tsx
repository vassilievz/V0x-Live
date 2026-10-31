import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { LocaleFlag } from "@/components/layout/LocaleFlag";
import {
  localeMeta,
  supportedLocales,
  type AppLocale,
  isAppLocale,
} from "@/i18n/locales";
import { setAppLocale } from "@/i18n";

type LanguageSelectorProps = {
  className?: string;
  variant?: "header" | "mobile";
};

export function LanguageSelector({
  className = "",
  variant = "header",
}: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current: AppLocale = isAppLocale(i18n.language) ? i18n.language : "pt";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (code: AppLocale) => {
    setAppLocale(code);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`locale-switcher locale-switcher--${variant}${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        className="locale-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={t("common.language.label")}
        onClick={() => setOpen((value) => !value)}
      >
        <LocaleFlag locale={current} />
        <span className="locale-trigger-label">
          {t(`common.language.names.${current}`)}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="locale-chevron"
          aria-hidden="true"
        />
      </button>
      {open ? (
        <ul
          id={listId}
          className="locale-menu home-bento"
          role="listbox"
          aria-label={t("common.language.label")}
        >
          {supportedLocales.map((code) => {
            const active = code === current;
            return (
              <li key={code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`locale-option${active ? " is-active" : ""}`}
                  onClick={() => pick(code)}
                >
                  <LocaleFlag locale={code} />
                  <span className="locale-option-label">
                    {t(`common.language.names.${code}`)}
                  </span>
                  <span className="locale-option-meta">
                    <span className="home-cell-code locale-option-code">
                      {localeMeta[code].shortLabel}
                    </span>
                    {active ? (
                      <Check size={14} strokeWidth={2.5} className="locale-option-check" aria-hidden />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
