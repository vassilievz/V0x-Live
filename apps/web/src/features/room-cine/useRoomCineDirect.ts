import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Hls from "hls.js";
import type { RoomCinePatchBody, RoomCineState } from "@v0xlive/api-client";
import { roomCineStreamPath } from "@v0xlive/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { expectedPositionSec } from "@/features/room-music/sync";
import { mergeCineState, transportCineSyncToken } from "@/features/room-cine/cinePlayerSync";
import { attachViewerVideoGuards } from "@/features/synced-playback/viewerVideoGuards";

const LOCAL_GUARD_MS = 750;
const SEEK_DRIFT_SEC = 2;
const DRIFT_SOFT_SEC = 0.8;
const CINE_SYNC_HEARTBEAT_MS = 10_000;
const VIEWER_DRIFT_TICK_MS = 2000;

function applyPlaybackDrift(video: HTMLVideoElement, expected: number): void {
  const drift = video.currentTime - expected;
  const abs = Math.abs(drift);
  if (abs <= DRIFT_SOFT_SEC) {
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
    }
    return;
  }
  if (abs > SEEK_DRIFT_SEC) {
    try {
      video.currentTime = expected;
    } catch {
      // ignore seek errors during load
    }
    video.playbackRate = 1;
    return;
  }
  video.playbackRate = drift > 0 ? 0.95 : 1.05;
}

async function startVideoPlayback(
  video: HTMLVideoElement,
  onPlaying: () => void,
  onBlocked: () => void,
): Promise<void> {
  try {
    await video.play();
    onPlaying();
    return;
  } catch {
    // autoplay policy — try muted so everyone at least sees motion
  }

  const wasMuted = video.muted;
  video.muted = true;
  try {
    await video.play();
    onPlaying();
    video.muted = wasMuted;
    if (!wasMuted) {
      onBlocked();
    }
  } catch {
    video.muted = wasMuted;
    onBlocked();
  }
}

type PatchFn = (body: RoomCinePatchBody) => void;

type Args = {
  roomId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  volume: number;
  state: RoomCineState | undefined;
  active: boolean;
  canControl: boolean;
  patch: PatchFn;
  queryClient: QueryClient;
};

export function useRoomCineDirect({
  roomId,
  videoRef,
  volume,
  state,
  active,
  canControl,
  patch,
  queryClient,
}: Args) {
  const hlsRef = useRef<Hls | null>(null);
  const applyingRemote = useRef(false);
  const localGuardUntil = useRef(0);
  const lastTransportToken = useRef("");
  const loadedSource = useRef<string | null>(null);
  const suppressPlaybackEvents = useRef(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const bumpLocalGuard = useCallback((ms = LOCAL_GUARD_MS) => {
    localGuardUntil.current = Date.now() + ms;
  }, []);

  const runWithoutPlaybackEvents = useCallback((fn: () => void) => {
    suppressPlaybackEvents.current = true;
    fn();
    window.setTimeout(() => {
      suppressPlaybackEvents.current = false;
    }, 0);
  }, []);

  const setCineCache = useCallback(
    (patchState: Partial<RoomCineState>) => {
      queryClient.setQueryData<RoomCineState>(["room-cine", roomId], (prev) =>
        mergeCineState(prev, patchState),
      );
    },
    [queryClient, roomId],
  );

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const applyRemoteTransport = useCallback(
    (next: RoomCineState) => {
      const video = videoRef.current;
      if (!video || !next.active || !next.source_url) {
        return;
      }

      if (Date.now() < localGuardUntil.current) {
        return;
      }

      const token = transportCineSyncToken(next);
      if (token === lastTransportToken.current) {
        return;
      }
      lastTransportToken.current = token;

      applyingRemote.current = true;
      const expected = expectedPositionSec(next);

      const applyTimeAndPlayState = () => {
        runWithoutPlaybackEvents(() => {
          applyPlaybackDrift(video, expected);
          if (next.playing) {
            void startVideoPlayback(
              video,
              () => {
                setLocalPlaying(true);
                setNeedsUnlock(false);
              },
              () => {
                setLocalPlaying(!video.paused);
                setNeedsUnlock(video.paused);
              },
            );
          } else {
            video.pause();
            setLocalPlaying(false);
          }
        });
      };

      if (loadedSource.current !== next.source_url) {
        return;
      }

      if (video.readyState >= 2) {
        applyTimeAndPlayState();
      } else {
        const onReady = () => {
          video.removeEventListener("canplay", onReady);
          applyTimeAndPlayState();
        };
        video.addEventListener("canplay", onReady);
      }

      window.setTimeout(() => {
        applyingRemote.current = false;
      }, 400);
    },
    [runWithoutPlaybackEvents, videoRef],
  );

  useEffect(() => {
    if (!active || !state?.source_url) {
      lastTransportToken.current = "";
      loadedSource.current = null;
      setLocalPlaying(false);
      setNeedsUnlock(false);
      setLoadError(false);
      return;
    }
    applyRemoteTransport(state);
  }, [active, state, applyRemoteTransport]);

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !state?.source_url || !video) {
      destroyHls();
      return;
    }

    const url = state.source_url;
    const playbackURL = roomCineStreamPath(roomId);
    if (loadedSource.current === url) {
      return;
    }

    destroyHls();
    setLoadError(false);
    loadedSource.current = url;
    lastTransportToken.current = "";

    const syncAfterLoad = () => {
      lastTransportToken.current = "";
      const latest = queryClient.getQueryData<RoomCineState>(["room-cine", roomId]) ?? state;
      if (latest?.active && latest.source_url === url) {
        applyRemoteTransport({
          ...latest,
          playing: latest.playing !== false,
          position_sec: latest.position_sec ?? 0,
        });
      }
    };

    const isHls = state.media_type === "hls";
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          xhrSetup: (xhr) => {
            xhr.withCredentials = true;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(playbackURL);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) {
            return;
          }
          const instance = hlsRef.current;
          if (!instance) {
            setLoadError(true);
            return;
          }
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              instance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              instance.recoverMediaError();
              break;
            default:
              setLoadError(true);
          }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, syncAfterLoad);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playbackURL;
      } else {
        setLoadError(true);
      }
    } else {
      video.src = playbackURL;
    }

    video.addEventListener("loadedmetadata", syncAfterLoad);
    video.addEventListener("canplay", syncAfterLoad);
    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", syncAfterLoad);
      video.removeEventListener("canplay", syncAfterLoad);
      destroyHls();
      video.removeAttribute("src");
      video.load();
      loadedSource.current = null;
    };
  }, [
    active,
    applyRemoteTransport,
    destroyHls,
    queryClient,
    roomId,
    state?.media_type,
    state?.source_url,
    videoRef,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume / 100;
    }
  }, [volume, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active) {
      return;
    }

    const onPlay = () => {
      if (suppressPlaybackEvents.current) {
        return;
      }
      if (applyingRemote.current) {
        setLocalPlaying(true);
        return;
      }
      if (!canControl) {
        return;
      }
      bumpLocalGuard();
      const pos = video.currentTime;
      const nowIso = new Date().toISOString();
      setCineCache({ playing: true, position_sec: pos, state_at: nowIso });
      if (state) {
        lastTransportToken.current = transportCineSyncToken({
          ...state,
          playing: true,
          position_sec: pos,
          state_at: nowIso,
        });
      }
      setLocalPlaying(true);
      patch({ action: "play", position_sec: pos });
    };

    const onPause = () => {
      if (suppressPlaybackEvents.current) {
        return;
      }
      if (applyingRemote.current) {
        setLocalPlaying(false);
        return;
      }
      if (!canControl) {
        return;
      }
      bumpLocalGuard();
      const pos = video.currentTime;
      const nowIso = new Date().toISOString();
      setCineCache({ playing: false, position_sec: pos, state_at: nowIso });
      if (state) {
        lastTransportToken.current = transportCineSyncToken({
          ...state,
          playing: false,
          position_sec: pos,
          state_at: nowIso,
        });
      }
      setLocalPlaying(false);
      patch({ action: "pause", position_sec: pos });
    };

    const onSeeked = () => {
      if (applyingRemote.current || !canControl) {
        return;
      }
      bumpLocalGuard();
      const pos = video.currentTime;
      const nowIso = new Date().toISOString();
      setCineCache({ position_sec: pos, state_at: nowIso, playing: localPlaying });
      if (state) {
        lastTransportToken.current = transportCineSyncToken({
          ...state,
          position_sec: pos,
          state_at: nowIso,
          playing: localPlaying,
        });
      }
      patch({ action: "seek", position_sec: pos });
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [active, bumpLocalGuard, canControl, localPlaying, patch, setCineCache, state, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active || canControl) {
      return;
    }
    return attachViewerVideoGuards(video, {
      canControl,
      getSnapshot: () => state,
      applyingRemote,
      suppressEvents: suppressPlaybackEvents,
    });
  }, [active, canControl, state, videoRef]);

  useEffect(() => {
    if (!canControl || !active || !state?.playing || !state.active) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const tick = window.setInterval(() => {
      if (applyingRemote.current) {
        return;
      }
      const pos = video.currentTime;
      const nowIso = new Date().toISOString();
      setCineCache({ playing: true, position_sec: pos, state_at: nowIso });
      patch({ action: "sync", position_sec: pos });
    }, CINE_SYNC_HEARTBEAT_MS);
    return () => window.clearInterval(tick);
  }, [active, canControl, patch, setCineCache, state?.active, state?.playing, videoRef]);

  useEffect(() => {
    if (canControl || !active || !state?.active || state.playing !== true) {
      return;
    }
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const tick = window.setInterval(() => {
      if (applyingRemote.current || Date.now() < localGuardUntil.current) {
        return;
      }
      const latest = stateRef.current;
      if (!latest?.active || latest.playing !== true) {
        return;
      }
      const expected = expectedPositionSec(latest);
      applyPlaybackDrift(video, expected);
    }, VIEWER_DRIFT_TICK_MS);
    return () => window.clearInterval(tick);
  }, [active, canControl, videoRef]);

  const sendPlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!canControl || !video || !state) {
      return;
    }
    bumpLocalGuard();
    const pos = video.currentTime;
    const willPlay = !localPlaying;
    const nowIso = new Date().toISOString();
    setCineCache({
      playing: willPlay,
      position_sec: pos,
      state_at: nowIso,
    });
    lastTransportToken.current = transportCineSyncToken({
      ...state,
      playing: willPlay,
      position_sec: pos,
      state_at: nowIso,
    });

    if (willPlay) {
      runWithoutPlaybackEvents(() => {
        void startVideoPlayback(
          video,
          () => {
            setLocalPlaying(true);
            setNeedsUnlock(false);
            patch({ action: "play", position_sec: video.currentTime });
          },
          () => {
            setNeedsUnlock(true);
            setLocalPlaying(false);
          },
        );
      });
    } else {
      runWithoutPlaybackEvents(() => {
        video.pause();
        setLocalPlaying(false);
      });
      patch({ action: "pause", position_sec: pos });
    }
  }, [
    bumpLocalGuard,
    canControl,
    localPlaying,
    patch,
    runWithoutPlaybackEvents,
    setCineCache,
    state,
    videoRef,
  ]);

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!canControl || !video || !state) {
        return;
      }
      bumpLocalGuard();
      const pos = Math.max(0, video.currentTime + delta);
      video.currentTime = pos;
      const nowIso = new Date().toISOString();
      setCineCache({ position_sec: pos, state_at: nowIso, playing: localPlaying });
      lastTransportToken.current = transportCineSyncToken({
        ...state,
        position_sec: pos,
        state_at: nowIso,
        playing: localPlaying,
      });
      patch({ action: "seek", position_sec: pos });
    },
    [bumpLocalGuard, canControl, localPlaying, patch, setCineCache, state, videoRef],
  );

  const seekTo = useCallback(
    (pos: number) => {
      const video = videoRef.current;
      if (!canControl || !video || !state) {
        return;
      }
      bumpLocalGuard();
      const clamped = Math.max(0, Math.min(pos, Number.isFinite(video.duration) ? video.duration : pos));
      video.currentTime = clamped;
      const nowIso = new Date().toISOString();
      setCineCache({ position_sec: clamped, state_at: nowIso, playing: localPlaying });
      lastTransportToken.current = transportCineSyncToken({
        ...state,
        position_sec: clamped,
        state_at: nowIso,
        playing: localPlaying,
      });
      patch({ action: "seek", position_sec: clamped });
    },
    [bumpLocalGuard, canControl, localPlaying, patch, setCineCache, state, videoRef],
  );

  const unlockPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !state) {
      return;
    }
    void startVideoPlayback(
      video,
      () => {
        setNeedsUnlock(false);
        setLocalPlaying(true);
        if (canControl && state.playing !== true) {
          patch({ action: "play", position_sec: video.currentTime });
        }
      },
      () => {
        setNeedsUnlock(true);
        setLocalPlaying(false);
      },
    );
  }, [canControl, patch, state, videoRef]);

  return {
    localPlaying,
    isPlaylist: false,
    sendPlayPause,
    seekBy,
    seekTo,
    skipPlaylist: () => undefined,
    needsUnlock,
    unlockPlayback,
    loadError,
  };
}
