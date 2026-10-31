import { useTranslation } from "react-i18next";
import { Radio } from "lucide-react";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import { cn } from "@/lib/cn";
import { fieldHelp, homeBentoPanel, sitePanelCompact } from "@/ui";

type Props = {
  message?: string;
  compact?: boolean;
};

export function RoomEntryLoading({ message, compact = false }: Props) {
  const { t } = useTranslation();
  const text = message ?? t("room.loading");

  return (
    <SiteCatalogShell>
      <section
        className={cn(
          homeBentoPanel,
          sitePanelCompact,
          "room-entry-loading",
          compact && "room-entry-loading--compact",
        )}
        aria-busy="true"
      >
        <div className="room-entry-loading-visual" aria-hidden="true">
          <span className="room-entry-loading-ring" />
          <span className="room-entry-loading-ring room-entry-loading-ring--delayed" />
          <Radio className="room-entry-loading-icon" strokeWidth={1.5} />
        </div>
        <p className={fieldHelp} role="status">
          {text}
        </p>
      </section>
    </SiteCatalogShell>
  );
}
