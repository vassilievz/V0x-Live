import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useBentoMeta } from "@/i18n/bentoMeta";
import { useOnlineStats } from "@/hooks/useOnlineStats";

/** Fourth meta bar cell on landing: live online count when API responds. */
export function useLandingMetaBar(): string[] {
  const { t } = useTranslation();
  const baseMeta = useBentoMeta("default");
  const online = useOnlineStats();

  return useMemo(() => {
    const labels = [...baseMeta];
    if (online.isSuccess && online.data.online >= 0) {
      labels[3] = t("landing.meta.onlineNow", { count: online.data.online });
    }
    return labels;
  }, [baseMeta, online.data?.online, online.isSuccess, t]);
}
