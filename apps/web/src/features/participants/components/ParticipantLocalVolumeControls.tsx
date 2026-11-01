import { useTranslation } from "react-i18next";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@v0xlive/ui";
import { useRoomMediaUi } from "@/features/streaming/RoomMediaUiContext";
import { cn } from "@/lib/cn";
import { roomParticipantIconBtn } from "@/ui";

type Props = {
  sessionId: string;
  displayName: string;
};

export function ParticipantLocalVolumeControls({ sessionId, displayName }: Props) {
  const { t } = useTranslation();
  const { getPref, setPref } = useRoomMediaUi();
  const pref = getPref(sessionId);

  return (
    <div className="mt-2 flex w-full min-w-0 flex-col gap-1.5 max-[480px]:pl-0">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(roomParticipantIconBtn, "shrink-0")}
          aria-label={
            pref.locallyMuted
              ? t("participants.localUnmute")
              : t("participants.localMute")
          }
          onClick={() => setPref(sessionId, { locallyMuted: !pref.locallyMuted })}
        >
          {pref.locallyMuted ? (
            <VolumeX className="size-4 text-danger" />
          ) : (
            <Volume2 className="size-4" />
          )}
        </Button>
        <label className="sr-only" htmlFor={`vol-${sessionId}`}>
          {t("participants.volumeAria", { name: displayName })}
        </label>
        <input
          id={`vol-${sessionId}`}
          type="range"
          min={0}
          max={200}
          step={5}
          value={pref.volume}
          disabled={pref.locallyMuted}
          className="h-2 min-h-0 flex-1 accent-foreground"
          aria-valuemin={0}
          aria-valuemax={200}
          aria-valuenow={pref.volume}
          onChange={(e) => setPref(sessionId, { volume: Number(e.target.value) })}
        />
        <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted">
          {pref.locallyMuted ? "0%" : `${pref.volume}%`}
        </span>
      </div>
    </div>
  );
}
