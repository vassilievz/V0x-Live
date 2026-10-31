import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Hls from "hls.js";
import type { RoomMusicPatchBody, RoomMusicState } from "@v0xlive/api-client";
import { roomMusicStreamPath } from "@v0xlive/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { expectedPositionSec } from "@/features/room-music/sync";
import { mergeMusicState, transportSyncToken } from "@/features/room-music/playerSync";

const LOCAL_GUARD_MS = 750;
const SEEK_DRIFT_SEC = 1.75;

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

type PatchFn = (body: RoomMusicPatchBody) => void;

type Args = {
  roomId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  volume: number;
  state: RoomMusicState | undefined;
  active: boolean;
  canControl: boolean;
  patch: PatchFn;
  queryClient: QueryClient;
};

export function useRoomMusicDirect({
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

  const setMusicCache = useCallback(
    (patchState: Partial<RoomMusicState>) => {
      queryClient.setQueryData<RoomMusicState>(["room-music", roomId], (prev) =>
        mergeMusicState(prev, patchState),
      );
    },
    [queryClient, roomId],
  );

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const applyRemoteTransport = useCallback(
    (next: RoomMusicState) => {
      const video = videoRef.current;
      if (!video || !next.active || !next.source_url) {
        return;
      }

      if (Date.now() < localGuardUntil.current) {
        return;
      }

      const token = transportSyncToken(next);
      if (token === lastTransportToken.current) {
        return;
      }
      lastTransportToken.current = token;

      applyingRemote.current = true;
      const expected = expectedPositionSec(next);

      const applyTimeAndPlayState = () => {
        runWithoutPlaybackEvents(() => {
          if (Math.abs(video.currentTime - expected) > SEEK_DRIFT_SEC) {
            try {
              video.currentTime = expected;
            } catch {
              // ignore seek errors during load
            }
          }
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
    const playbackURL = roomMusicStreamPath(roomId);
    if (loadedSource.current === url) {
      return;
    }

    destroyHls();
    setLoadError(false);
    loadedSource.current = url;
    lastTransportToken.current = "";

    const syncAfterLoad = () => {
      lastTransportToken.current = "";
      const latest = queryClient.getQueryData<RoomMusicState>(["room-music", roomId]) ?? state;
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
      setMusicCache({ playing: true, position_sec: pos, state_at: nowIso });
      if (state) {
        lastTransportToken.current = transportSyncToken({
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
      setMusicCache({ playing: false, position_sec: pos, state_at: nowIso });
      if (state) {
        lastTransportToken.current = transportSyncToken({
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
      setMusicCache({ position_sec: pos, state_at: nowIso, playing: localPlaying });
      if (state) {
        lastTransportToken.current = transportSyncToken({
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
  }, [active, bumpLocalGuard, canControl, localPlaying, patch, setMusicCache, state, videoRef]);

  const sendPlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!canControl || !video || !state) {
      return;
    }
    bumpLocalGuard();
    const pos = video.currentTime;
    const willPlay = !localPlaying;
    const nowIso = new Date().toISOString();
    setMusicCache({
      playing: willPlay,
      position_sec: pos,
      state_at: nowIso,
    });
    lastTransportToken.current = transportSyncToken({
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
    setMusicCache,
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
      setMusicCache({ position_sec: pos, state_at: nowIso, playing: localPlaying });
      lastTransportToken.current = transportSyncToken({
        ...state,
        position_sec: pos,
        state_at: nowIso,
        playing: localPlaying,
      });
      patch({ action: "seek", position_sec: pos });
    },
    [bumpLocalGuard, canControl, localPlaying, patch, setMusicCache, state, videoRef],
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
      setMusicCache({ position_sec: clamped, state_at: nowIso, playing: localPlaying });
      lastTransportToken.current = transportSyncToken({
        ...state,
        position_sec: clamped,
        state_at: nowIso,
        playing: localPlaying,
      });
      patch({ action: "seek", position_sec: clamped });
    },
    [bumpLocalGuard, canControl, localPlaying, patch, setMusicCache, state, videoRef],
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
