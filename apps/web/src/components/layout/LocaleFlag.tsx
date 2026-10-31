import type { AppLocale } from "@/i18n/locales";

type LocaleFlagProps = {
  locale: AppLocale;
  className?: string;
};

export function LocaleFlag({ locale, className = "" }: LocaleFlagProps) {
  const cn = `locale-flag-svg${className ? ` ${className}` : ""}`;

  switch (locale) {
    case "en":
      return (
        <svg className={cn} viewBox="0 0 21 15" width="21" height="15" aria-hidden="true">
          <rect width="21" height="15" rx="2" fill="#b22234" />
          <path fill="#fff" d="M0 1.15h21v1.15H0zm0 2.3h21v1.15H0zm0 2.3h21v1.15H0zm0 2.31h21v1.15H0zm0 2.3h21v1.15H0zm0 2.3h21V15H0z" />
          <rect width="8.4" height="8.05" fill="#3c3b6e" />
          <g fill="#fff" opacity="0.95">
            <circle cx="1.2" cy="1.1" r="0.35" />
            <circle cx="2.5" cy="1.1" r="0.35" />
            <circle cx="3.8" cy="1.1" r="0.35" />
            <circle cx="5.1" cy="1.1" r="0.35" />
            <circle cx="6.4" cy="1.1" r="0.35" />
            <circle cx="1.85" cy="2.2" r="0.35" />
            <circle cx="3.15" cy="2.2" r="0.35" />
            <circle cx="4.45" cy="2.2" r="0.35" />
            <circle cx="5.75" cy="2.2" r="0.35" />
            <circle cx="7.05" cy="2.2" r="0.35" />
          </g>
        </svg>
      );
    case "pt":
      return (
        <svg className={cn} viewBox="0 0 21 15" width="21" height="15" aria-hidden="true">
          <rect width="21" height="15" rx="2" fill="#009b3a" />
          <path fill="#fedf00" d="M10.5 2.2 17.8 7.5 10.5 12.8 3.2 7.5z" />
          <circle cx="10.5" cy="7.5" r="2.6" fill="#002776" />
          <path
            fill="#fff"
            d="M8.1 7.5c0-1.3 1.1-2.4 2.4-2.4.5 0 .9.1 1.3.3-.6-.9-1.6-1.5-2.8-1.5-1.8 0-3.3 1.5-3.3 3.3 0 1.2.6 2.2 1.6 2.8-.3-.2-.7-.3-1.2-.3-1.3 0-2.4-1.1-2.4-2.4z"
          />
        </svg>
      );
    case "ru":
      return (
        <svg className={cn} viewBox="0 0 21 15" width="21" height="15" aria-hidden="true">
          <rect width="21" height="15" rx="2" fill="#fff" />
          <rect y="5" width="21" height="5" fill="#0039a6" />
          <rect y="10" width="21" height="5" fill="#d52b1e" />
        </svg>
      );
    case "es":
      return (
        <svg className={cn} viewBox="0 0 21 15" width="21" height="15" aria-hidden="true">
          <rect width="21" height="15" rx="2" fill="#c60b1e" />
          <rect y="3.75" width="21" height="7.5" fill="#ffc400" />
        </svg>
      );
    default: {
      const exhaustive: never = locale;
      return exhaustive;
    }
  }
}
