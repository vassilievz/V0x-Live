import { useEffect, useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Lock,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import type { RealtimeEvent, RoomMusicPatchBody, RoomMusicState } from "@v0xlive/api-client";
import { roomsApi } from "@/lib/api";
import { musicThumbnailUrl } from "@/features/room-music/metadata";
import { useRoomMusicYouTube } from "@/features/room-music/useRoomMusicYouTube";
import {
  roomMusicIconBtn,
  roomMusicPlayBtn,
  roomMusicPlayer,
  roomMusicPlayerArt,
  roomMusicPlayerBody,
  roomMusicPlayerClose,
  roomMusicPlayerControls,
  roomMusicPlayerFoot,
  roomMusicPlayerFrame,
  roomMusicPlayerHead,
  roomMusicPlayerKicker,
  roomMusicPlayerSub,
  roomMusicPlayerTitle,
  roomMusicVolume,
} from "@/ui";

type Props = {
  roomId: string;
  lastEvent: RealtimeEvent | null;
  viewerRole?: string | null;
};

export function RoomMusicPlayer({ roomId, lastEvent, viewerRole }: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const frameId = useId().replace(/:/g, "");
  const [volume, setVolume] = useState(70);

  const music = useQuery({
    queryKey: ["room-music", roomId],
    queryFn: () => roomsApi.getMusic(roomId),
  });

  useEffect(() => {
    if (lastEvent?.type === "room.music.updated") {
      queryClient.setQueryData(["room-music", roomId], lastEvent.payload as RoomMusicState);
    }
  }, [lastEvent, queryClient, roomId]);

  const patch = useMutation({
    mutationFn: (body: RoomMusicPatchBody) => roomsApi.patchMusic(roomId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-music", roomId], data);
    },
  });

  const clear = useMutation({
    mutationFn: () => roomsApi.clearMusic(roomId),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-music", roomId], data);
    },
  });

  const state = music.data;
  const active = state?.active === true;
  const canControl = state?.can_control === true;

  const { localPlaying, isPlaylist, sendPlayPause, seekBy, skipPlaylist } =
    useRoomMusicYouTube({
      roomId,
      frameId,
      volume,
      state,
      active,
      canControl,
      patch: patch.mutate,
      queryClient,
    });

  if (!active || !state) {
    return null;
  }

  const canRemove = canControl || viewerRole === "host";
  const thumb = musicThumbnailUrl(state);
  const addedByName = state.added_by_name ?? t("music.someone");
  const channelLine = state.author_name
    ? t("music.addedBy", { author: state.author_name, name: addedByName })
    : t("music.addedByYoutube", { name: addedByName });
  const lockedLabel =
    state.control_mode === "everyone"
      ? t("music.everyoneControls")
      : t("music.ownerControls", {
          name: state.added_by_name ?? t("music.ownerFallback"),
        });

  const onSkipBack = () => {
    if (isPlaylist) {
      skipPlaylist("prev");
    } else {
      seekBy(-10);
    }
  };

  const onSkipForward = () => {
    if (isPlaylist) {
      skipPlaylist("next");
    } else {
      seekBy(10);
    }
  };

  const skipBackLabel = isPlaylist ? t("music.skipPrevTrack") : t("music.skipPrevSec");
  const skipForwardLabel = isPlaylist ? t("music.skipNextTrack") : t("music.skipNextSec");

  return (
    <section className={roomMusicPlayer} aria-label={t("music.sectionAria")}>
      <div className={roomMusicPlayerHead}>
        <p className={roomMusicPlayerKicker}>
          {t("music.kicker")}
          {!canControl ? <Lock className="size-3.5" aria-hidden="true" /> : null}
        </p>
        <button
          type="button"
          className={roomMusicPlayerClose}
          aria-label={t("music.remove")}
          disabled={!canRemove}
          onClick={() => {
            if (canRemove) clear.mutate();
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className={roomMusicPlayerBody}>
        <div className={roomMusicPlayerArt}>
          {thumb ? (
            <img
              key={state.video_id ?? "no-video"}
              src={thumb}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <div>
          <p className={roomMusicPlayerTitle}>{state.title ?? "YouTube"}</p>
          <p className={roomMusicPlayerSub}>{channelLine}</p>
        </div>
      </div>

      <div className={roomMusicPlayerControls}>
        <button
          type="button"
          className={roomMusicIconBtn}
          aria-label={skipBackLabel}
          disabled={!canControl}
          onClick={onSkipBack}
        >
          <SkipBack className="size-4" />
        </button>
        <button
          type="button"
          className={roomMusicPlayBtn}
          aria-label={localPlaying ? t("music.pause") : t("music.play")}
          disabled={!canControl}
          onClick={sendPlayPause}
        >
          {localPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          type="button"
          className={roomMusicIconBtn}
          aria-label={skipForwardLabel}
          disabled={!canControl}
          onClick={onSkipForward}
        >
          <SkipForward className="size-4" />
        </button>
        <label className={roomMusicVolume}>
          <Volume2 className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label={t("music.volume")}
          />
        </label>
      </div>

      <p className={roomMusicPlayerFoot}>{lockedLabel}</p>
      <div id={frameId} className={roomMusicPlayerFrame} aria-hidden="true" />
    </section>
  );
}
