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
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useRoomCineRequired } from "@/features/room-cine/RoomCineContext";
import { dispatchOpenCineCatalog } from "@/features/room-cine/cineEvents";
import { Button } from "@v0xlive/ui";
import {
  broadcastStageDirectShell,
  broadcastStageDirectVideo,
  notice,
  roomMusicIconBtn,
  roomMusicPlayBtn,
  roomMusicSyncBtn,
} from "@/ui";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) {
    return "0:00";
  }
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RoomCineStage() {
  const { t } = useTranslation();
  const {
    state,
    isCatalog,
    isDirect,
    canControl,
    stageShellRef,
    videoRef,
    volume,
    setVolume,
    direct,
    requestStageFullscreen,
    patch,
    stop,
  } = useRoomCineRequired();

  const { localPlaying, sendPlayPause, seekBy, seekTo, needsUnlock, unlockPlayback, loadError } =
    direct;

  const [fs, setFs] = useState(false);
  const [vpnHelpOpen, setVpnHelpOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isDirect) {
      return;
    }
    const onTime = () => setCurrentTime(video.currentTime);
    const onMeta = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    onTime();
    onMeta();
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [isDirect, state?.source_url, videoRef]);

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

  if (!state?.active) {
    return null;
  }

  if (isCatalog && !state.embed_url?.trim()) {
    return (
      <div className={cn(broadcastStageDirectShell, "broadcast-stage-cine-catalog")}>
        <div className="flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-4 p-6 text-center">
          <p className={notice}>{t("cine.directLoadError")}</p>
          {canControl ? (
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" onClick={() => dispatchOpenCineCatalog()}>
                {t("cine.changeTitle")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => stop()}>
                {t("cine.stopSession")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (isCatalog && state.embed_url) {
    const seriesLabel =
      state.content_type === "serie" && state.season && state.episode
        ? `${state.title ?? t("cine.defaultTitle")} — T${state.season}:E${state.episode}`
        : (state.title ?? t("cine.defaultTitle"));

    return (
      <div ref={stageShellRef} className={cn(broadcastStageDirectShell, "broadcast-stage-cine-catalog")}>
        <div className="broadcast-stage-cine-banner">
          {canControl ? (
            <div className="broadcast-stage-cine-host-bar">
              <p className="broadcast-stage-direct-title">{seriesLabel}</p>
              <div className="broadcast-stage-cine-host-actions">
                {state.content_type === "serie" ? (
                  <>
                    <button
                      type="button"
                      className="lk-button text-xs"
                      onClick={() => patch({ action: "prev_episode" })}
                    >
                      {t("cine.prevEpisode")}
                    </button>
                    <button
                      type="button"
                      className="lk-button text-xs"
                      onClick={() => patch({ action: "next_episode" })}
                    >
                      {t("cine.nextEpisode")}
                    </button>
                  </>
                ) : null}
                <button type="button" className="lk-button text-xs" onClick={() => dispatchOpenCineCatalog()}>
                  {t("cine.changeTitle")}
                </button>
                <button type="button" className="lk-button text-xs" onClick={() => stop()}>
                  {t("cine.stopSession")}
                </button>
              </div>
            </div>
          ) : (
            <p className={notice}>{t("cine.catalogWarningShort")}</p>
          )}
          {!canControl ? <p className="broadcast-stage-direct-foot">{t("cine.hostOnlyStatus")}</p> : null}
          <button
            type="button"
            className="broadcast-stage-direct-fs"
            aria-label={fs ? t("cine.exitFullscreen") : t("cine.fullscreen")}
            onClick={requestStageFullscreen}
          >
            {fs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
        <div className="broadcast-stage-cine-vpn-bar">
          <button
            type="button"
            className="lk-button text-xs"
            aria-expanded={vpnHelpOpen}
            onClick={() => setVpnHelpOpen((open) => !open)}
          >
            {t("cine.embedLoadHelpTrigger")}
          </button>
          {vpnHelpOpen ? (
            <div className={cn(notice, "broadcast-stage-cine-vpn-help")} role="note">
              <p className="font-medium text-foreground">{t("cine.embedLoadHelpTitle")}</p>
              <p className="mt-2 text-sm leading-relaxed">{t("cine.embedLoadHelpBody")}</p>
            </div>
          ) : null}
        </div>
        <iframe
          key={state.embed_url}
          src={state.embed_url}
          title={state.title ?? t("cine.defaultTitle")}
          className="broadcast-stage-cine-iframe"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (!isDirect || !state.source_url) {
    return null;
  }

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div ref={stageShellRef} className={broadcastStageDirectShell}>
      <video
        ref={videoRef}
        className={broadcastStageDirectVideo}
        playsInline
        controls={false}
        preload="auto"
      />

      <div className="broadcast-stage-direct-player" aria-label={t("cine.stageAria")}>
        <div className="broadcast-stage-direct-top">
          <div className="broadcast-stage-direct-meta">
            <p className="broadcast-stage-direct-kicker">
              {t("cine.directKicker")}
              {!canControl ? <Lock className="size-3.5" aria-hidden="true" /> : null}
            </p>
            <p className="broadcast-stage-direct-title">{state.title ?? t("cine.defaultTitle")}</p>
            <p className="broadcast-stage-direct-sub">{t("cine.directSyncHint")}</p>
          </div>
          <button
            type="button"
            className="broadcast-stage-direct-fs"
            aria-label={fs ? t("cine.exitFullscreen") : t("cine.fullscreen")}
            onClick={requestStageFullscreen}
          >
            {fs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>

        {loadError ? (
          <p className="broadcast-stage-direct-error" role="alert">
            {t("cine.directLoadError")}
          </p>
        ) : null}

        {needsUnlock ? (
          <button type="button" className={roomMusicSyncBtn} onClick={unlockPlayback}>
            {t("cine.syncPlayback")}
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
              aria-label={t("cine.seekAria")}
              onChange={(e) => onProgressInput(Number(e.target.value))}
            />
            <span className="broadcast-stage-direct-time">{formatTime(duration)}</span>
          </div>
          <div className="broadcast-stage-direct-controls">
            <button
              type="button"
              className={roomMusicIconBtn}
              disabled={!canControl}
              aria-label={t("cine.skipBack")}
              onClick={() => seekBy(-10)}
            >
              <SkipBack className="size-4" />
            </button>
            <button
              type="button"
              className={roomMusicPlayBtn}
              disabled={!canControl}
              aria-label={localPlaying ? t("cine.pause") : t("cine.play")}
              onClick={sendPlayPause}
            >
              {localPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              type="button"
              className={roomMusicIconBtn}
              disabled={!canControl}
              aria-label={t("cine.skipForward")}
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
                aria-label={t("cine.volume")}
              />
            </label>
            {!canControl ? (
              <p className="broadcast-stage-direct-foot">{t("cine.hostOnlyStatus")}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
