import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useRoomDirectVideoRequired } from "@/features/room-music/RoomDirectVideoContext";
import { useRoomMusicYouTube } from "@/features/room-music/useRoomMusicYouTube";
import { broadcastStageDirectShell, roomMusicSyncBtn } from "@/ui";

export function RoomYouTubeStage() {
  const { t } = useTranslation();
  const playerHostRef = useRef<HTMLDivElement>(null);
  const [playerHostElement, setPlayerHostElement] = useState<HTMLDivElement | null>(null);
  const bindPlayerHost = useCallback((node: HTMLDivElement | null) => {
    playerHostRef.current = node;
    setPlayerHostElement(node);
  }, []);
  const {
    roomId,
    queryClient,
    stageShellRef,
    state,
    volume,
    canControl,
    canRemoveMusic,
    patch,
    clear,
  } = useRoomDirectVideoRequired();

  const youtube = useRoomMusicYouTube({
    roomId,
    playerHostRef,
    playerHostElement,
    volume,
    state,
    active: Boolean(state?.active && state.platform !== "direct"),
    canControl,
    patch,
    queryClient,
    stageVisible: true,
  });

  const { localPlaying, playerError, playerReady, unlockPlayback } = youtube;

  if (!state?.active || state.platform === "direct") {
    return null;
  }

  const needsUnlock = !localPlaying && playerReady && !playerError;

  const startPlayback = () => {
    unlockPlayback();
  };

  return (
    <div
      ref={stageShellRef}
      className={cn(broadcastStageDirectShell, "broadcast-stage-youtube-shell")}
    >
      {state.thumbnail_url && !playerReady ? (
        <img
          src={state.thumbnail_url}
          alt=""
          className="broadcast-stage-youtube-poster"
          draggable={false}
        />
      ) : null}
      <div
        ref={bindPlayerHost}
        className="broadcast-stage-youtube-host"
        data-yt-ready={playerReady ? "true" : "false"}
        aria-label={state.title ?? "YouTube"}
      />
      {!canControl ? <div className="broadcast-stage-youtube-shield" aria-hidden="true" /> : null}

      {canRemoveMusic ? (
        <div className="broadcast-stage-youtube-actions">
          <button
            type="button"
            className="broadcast-stage-youtube-action-btn"
            aria-label={t("music.remove")}
            onClick={() => clear()}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {playerError ? (
        <p className="broadcast-stage-youtube-banner broadcast-stage-youtube-banner--error" role="alert">
          {t("music.youtubeLoadError")}
        </p>
      ) : null}

      {needsUnlock ? (
        <button
          type="button"
          className={cn(roomMusicSyncBtn, "broadcast-stage-youtube-unlock")}
          onClick={startPlayback}
        >
          {t("music.syncPlayback")}
        </button>
      ) : null}
    </div>
  );
}
