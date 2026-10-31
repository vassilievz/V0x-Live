import { useTranslation } from "react-i18next";
import {
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useRoomDirectVideoRequired } from "@/features/room-music/RoomDirectVideoContext";
import {
  broadcastStageDirectShell,
  broadcastStageDirectVideo,
  roomMusicIconBtn,
  roomMusicPlayBtn,
  roomMusicSyncBtn,
} from "@/ui";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return "0:00";
  }
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
}

const CONTROLS_IDLE_MS = 3200;

export function RoomDirectVideoStage() {
  const { t } = useTranslation();
  const {
    videoRef,
    stageShellRef,
    state,
    volume,
    setVolume,
    canControl,
    canRemoveMusic,
    direct,
    clear,
    requestStageFullscreen,
  } = useRoomDirectVideoRequired();
  const { localPlaying, sendPlayPause, seekBy, seekTo, needsUnlock, unlockPlayback, loadError } =
    direct;

  const [fs, setFs] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideChromeTimer = useRef<number | null>(null);

  const scheduleChromeHide = useCallback(
    (playing: boolean, unlock: boolean, error: boolean) => {
      if (hideChromeTimer.current !== null) {
        window.clearTimeout(hideChromeTimer.current);
        hideChromeTimer.current = null;
      }
      if (!playing || unlock || error) {
        setChromeVisible(true);
        return;
      }
      hideChromeTimer.current = window.setTimeout(() => {
        setChromeVisible(false);
        hideChromeTimer.current = null;
      }, CONTROLS_IDLE_MS);
    },
    [],
  );

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleChromeHide(localPlaying, needsUnlock, loadError);
  }, [loadError, localPlaying, needsUnlock, scheduleChromeHide]);

  useEffect(() => {
    scheduleChromeHide(localPlaying, needsUnlock, loadError);
    return () => {
      if (hideChromeTimer.current !== null) {
        window.clearTimeout(hideChromeTimer.current);
      }
    };
  }, [loadError, localPlaying, needsUnlock, scheduleChromeHide]);

  useEffect(() => {
    const shell = stageShellRef.current;
    if (!shell) {
      return;
    }
    const onActivity = () => revealChrome();
    shell.addEventListener("mousemove", onActivity);
    shell.addEventListener("mousedown", onActivity);
    shell.addEventListener("touchstart", onActivity, { passive: true });
    shell.addEventListener("keydown", onActivity);
    return () => {
      shell.removeEventListener("mousemove", onActivity);
      shell.removeEventListener("mousedown", onActivity);
      shell.removeEventListener("touchstart", onActivity);
      shell.removeEventListener("keydown", onActivity);
    };
  }, [revealChrome, stageShellRef]);

  useEffect(() => {
    const onChange = () => {
      setFs(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const onTime = () => setCurrentTime(video.currentTime);
    const onMeta = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    const onDur = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onDur);
    onTime();
    onMeta();

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onDur);
    };
  }, [state?.source_url, videoRef]);

  const onProgressInput = useCallback(
    (value: number) => {
      if (!canControl || !Number.isFinite(duration) || duration <= 0) {
        return;
      }
      const pos = (value / 100) * duration;
      seekTo(pos);
      setCurrentTime(pos);
    },
    [canControl, duration, seekTo],
  );

  if (!state?.source_url) {
    return null;
  }

  const addedByName = state.added_by_name ?? t("music.someone");
  const channelLine = t("music.addedByDirect", { name: addedByName });
  const lockedLabel =
    state.control_mode === "everyone"
      ? t("music.everyoneControls")
      : t("music.ownerControls", {
          name: state.added_by_name ?? t("music.ownerFallback"),
        });
  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const showChrome = chromeVisible || !localPlaying || needsUnlock || loadError;

  return (
    <div
      ref={stageShellRef}
      className={cn(
        broadcastStageDirectShell,
        !showChrome && "broadcast-stage-direct--idle",
      )}
    >
      <video
        ref={videoRef}
        className={broadcastStageDirectVideo}
        playsInline
        controls={false}
        preload="auto"
        onClick={revealChrome}
      />

      <div
        className={cn(
          "broadcast-stage-direct-player",
          !showChrome && "broadcast-stage-direct-player--idle",
        )}
        aria-label={t("music.sectionAria")}
        onFocusCapture={revealChrome}
      >
        <div className="broadcast-stage-direct-top">
          <div className="broadcast-stage-direct-meta">
            <p className="broadcast-stage-direct-kicker">
              {t("music.kicker")}
              {!canControl ? <Lock className="size-3.5" aria-hidden="true" /> : null}
            </p>
            <p className="broadcast-stage-direct-title">{state.title ?? t("music.directFallbackTitle")}</p>
            <p className="broadcast-stage-direct-sub">{channelLine}</p>
          </div>
          <div className="broadcast-stage-direct-top-actions">
            <button
              type="button"
              className="broadcast-stage-direct-fs"
              aria-label={fs ? t("music.exitFullscreen") : t("music.fullscreen")}
              onClick={requestStageFullscreen}
            >
              {fs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              type="button"
              className="broadcast-stage-direct-fs"
              aria-label={t("music.remove")}
              disabled={!canRemoveMusic}
              onClick={() => clear()}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {loadError ? (
          <p className="broadcast-stage-direct-error" role="alert">
            {t("music.directLoadError")}
          </p>
        ) : null}

        {needsUnlock ? (
          <button
            type="button"
            className={cn(roomMusicSyncBtn, "broadcast-stage-direct-unlock")}
            onClick={unlockPlayback}
          >
            {t("music.syncPlayback")}
          </button>
        ) : null}

        <div className="broadcast-stage-direct-dock">
          <div className="broadcast-stage-direct-progress">
            <span className="broadcast-stage-direct-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="broadcast-stage-direct-scrub"
              min={0}
              max={100}
              step={0.1}
              value={progressPct}
              disabled={!canControl || duration <= 0}
              aria-label={t("music.seekAria")}
              onChange={(e) => onProgressInput(Number(e.target.value))}
            />
            <span className="broadcast-stage-direct-time">{formatTime(duration)}</span>
          </div>

          <div className="broadcast-stage-direct-controls">
            <button
              type="button"
              className={roomMusicIconBtn}
              aria-label={t("music.skipPrevSec")}
              disabled={!canControl}
              onClick={() => seekBy(-10)}
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
              aria-label={t("music.skipNextSec")}
              disabled={!canControl}
              onClick={() => seekBy(10)}
            >
              <SkipForward className="size-4" />
            </button>
            <label className="broadcast-stage-direct-volume">
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
            <p className="broadcast-stage-direct-foot">{lockedLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
