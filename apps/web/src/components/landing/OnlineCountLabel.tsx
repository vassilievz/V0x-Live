import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { useOnlineStats } from "@/hooks/useOnlineStats";
import { homeCellCode, homeOnlinePulse, statusOnline } from "@/ui";

type OnlineCountLabelProps = {
  className?: string;
  code?: string;
};

export function OnlineCountLabel({ className, code = "SIG-01" }: OnlineCountLabelProps) {
  const { t } = useTranslation();
  const online = useOnlineStats();

  const label =
    online.isSuccess && online.data.online >= 0
      ? t("landing.hero.onlineNow", { count: online.data.online })
      : t("landing.hero.onlineLoading");

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.08em]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cn(homeCellCode, "mb-0")}>{code}</span>
      <span className={cn(statusOnline, "inline-flex items-center gap-2")}>
        <span className={homeOnlinePulse} aria-hidden="true" />
        {label}
      </span>
    </span>
  );
}
