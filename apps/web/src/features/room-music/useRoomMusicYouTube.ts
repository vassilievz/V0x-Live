import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { RoomMusicPatchBody, RoomMusicState } from "@v0xlive/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { buildYouTubeEmbedId } from "@/features/room-music/youtube";
import { musicThumbnailUrl } from "@/features/room-music/metadata";
import { expectedPositionSec } from "@/features/room-music/sync";
import { mergeMusicState, transportSyncToken } from "@/features/room-music/playerSync";
import {
  YT_CUED,
  YT_PLAYING,
  fitStagePlayerToHost,
  loadRemoteVideo,
  loadYouTubeIframeAPI,
  measureStagePlayerSize,
  readVideoData,
  type YouTubePlayerHandle,
} from "@/features/room-music/youtubePlayer";

const LOCAL_GUARD_MS = 750;
const SEEK_DRIFT_SEC = 2;
const YT_PAUSED = 2;
const YT_ENDED = 0;

function trackVideoId(id: string | null | undefined): string | null {
  const trimmed = id?.trim();
  if (!trimmed || trimmed === "videoseries") return null;
  return trimmed;
}

type PatchFn = (body: RoomMusicPatchBody) => void;

type Args = {
  roomId: string;
  playerHostRef: RefObject<HTMLDivElement | null>;
  playerHostElement: HTMLDivElement | null;
  volume: number;
  state: RoomMusicState | undefined;
  active: boolean;
  canControl: boolean;
  patch: PatchFn;
  queryClient: QueryClient;
  /** Player visível no palco (controles nativos do YouTube). */
  stageVisible?: boolean;
};

export function useRoomMusicYouTube({
  roomId,
  playerHostRef,
  playerHostElement,
  volume,
  state,
  active,
  canControl,
  patch,
  queryClient,
  stageVisible = true,
}: Args) {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const applyingRemote = useRef(false);
  const localGuardUntil = useRef(0);
  const lastTransportToken = useRef("");
  const loadedVideoId = useRef<string | null>(null);
  const lastSyncedVideoId = useRef<string | null>(null);
  const syncTrackInFlight = useRef(false);
  const playerInitGenRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [localPlaying, setLocalPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  const bumpLocalGuard = useCallback((ms = LOCAL_GUARD_MS) => {
    localGuardUntil.current = Date.now() + ms;
  }, []);

  const setMusicCache = useCallback(
    (patchState: Partial<RoomMusicState>) => {
      queryClient.setQueryData<RoomMusicState>(["room-music", roomId], (prev) =>
        mergeMusicState(prev, patchState),
      );
    },
    [queryClient, roomId],
  );

  const syncCurrentTrack = useCallback(
    (playing: boolean, force = false) => {
      const player = playerRef.current;
      if (!player || !canControl || !state?.active) return;
      const data = readVideoData(player);
      if (!data?.video_id) return;
      if (!force && data.video_id === lastSyncedVideoId.current) return;
      if (syncTrackInFlight.current) return;

      lastSyncedVideoId.current = data.video_id;
      loadedVideoId.current = data.video_id;
      const pos = player.getCurrentTime();
      const thumb =
        musicThumbnailUrl({ video_id: data.video_id }) ??
        `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`;
      const nowIso = new Date().toISOString();

      setMusicCache({
        video_id: data.video_id,
        title: data.title?.trim() || "YouTube",
        author_name: data.author?.trim() || state.author_name,
        thumbnail_url: thumb,
        playing,
        position_sec: pos,
        state_at: nowIso,
      });
      bumpLocalGuard(1200);

      syncTrackInFlight.current = true;
      patch({
        action: "sync_track",
        video_id: data.video_id,
        title: data.title?.trim() || undefined,
        author_name: data.author?.trim() || undefined,
        thumbnail_url: thumb,
        position_sec: pos,
        playing,
      });
      window.setTimeout(() => {
        syncTrackInFlight.current = false;
      }, 400);
    },
    [bumpLocalGuard, canControl, patch, setMusicCache, state?.active, state?.author_name],
  );

  const applyRemoteTransport = useCallback((next: RoomMusicState) => {
    const player = playerRef.current;
    if (!player || !next.active) return;

    if (Date.now() < localGuardUntil.current) {
      return;
    }

    const token = transportSyncToken(next);
    if (token === lastTransportToken.current) {
      return;
    }
    lastTransportToken.current = token;

    const remoteVideo = trackVideoId(next.video_id);
    const loadedVideo = trackVideoId(loadedVideoId.current);
    if (remoteVideo && remoteVideo !== loadedVideo) {
      applyingRemote.current = true;
      const pos = expectedPositionSec(next);
      loadRemoteVideo(player, next, pos);
      loadedVideoId.current = remoteVideo;
      lastSyncedVideoId.current = remoteVideo;
      if (next.playing) {
        player.playVideo();
        setLocalPlaying(true);
      } else {
        player.pauseVideo();
        setLocalPlaying(false);
      }
      window.setTimeout(() => {
        applyingRemote.current = false;
      }, 500);
      return;
    }

    applyingRemote.current = true;
    const expected = expectedPositionSec(next);
    const current = player.getCurrentTime();
    if (Math.abs(expected - current) > SEEK_DRIFT_SEC) {
      player.seekTo(expected, true);
    }
    if (next.playing) {
      player.playVideo();
      setLocalPlaying(true);
    } else {
      player.pauseVideo();
      setLocalPlaying(false);
    }
    window.setTimeout(() => {
      applyingRemote.current = false;
    }, 350);
  }, []);

  useEffect(() => {
    if (!active || !state) {
      lastTransportToken.current = "";
      loadedVideoId.current = null;
      lastSyncedVideoId.current = null;
      setPlayerReady(false);
      return;
    }
    if (!playerReady) return;
    applyRemoteTransport(state);
  }, [active, state, applyRemoteTransport, playerReady]);

  const canControlRef = useRef(canControl);
  canControlRef.current = canControl;

  const playerSessionKey =
    state?.playlist_id?.trim() || state?.video_id?.trim() || "";

  useEffect(() => {
    const host = playerHostElement ?? playerHostRef.current;
    if (typeof window !== "undefined") {
      (window as any).__ytEffectCount = ((window as any).__ytEffectCount || 0) + 1;
      (window as any).__ytEffectLast = { active, hasState: !!state, key: playerSessionKey, hasHost: !!host, connected: host?.isConnected, yt: !!window.YT?.Player };
    }
    if (!active || !state || !playerSessionKey || !host) {
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      return;
    }

    const embed = buildYouTubeEmbedId(state);
    if (!embed) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const initGen = ++playerInitGenRef.current;
    setPlayerError(false);

    let sizeAttempts = 0;
    const createPlayer = () => {
      console.log("[YT create] initGen=", initGen, "current=", playerInitGenRef.current, "cancelled=", cancelled, "yt=", !!window.YT?.Player);
      if (cancelled || initGen !== playerInitGenRef.current || !window.YT?.Player) {
        console.log("[YT create] bail early");
        return;
      }
      const liveHost = playerHostRef.current ?? host;
      console.log("[YT create] host connected=", liveHost?.isConnected, "sizeAttempts=", sizeAttempts);
      if (!liveHost.isConnected) {
        return;
      }

      const { width, height } = measureStagePlayerSize(liveHost);
      console.log("[YT create] size=", width, height);
      if ((width < 48 || height < 48) && sizeAttempts < 30) {
        sizeAttempts += 1;
        window.requestAnimationFrame(createPlayer);
        return;
      }

      playerRef.current?.destroy();
      playerRef.current = null;
      liveHost.replaceChildren();
      console.log("[YT create] creating YT.Player with id=", embed?.videoId);

      const snapshot = stateRef.current;
      if (!snapshot) {
        return;
      }
      try {
        console.log("[YT create] before constructor");
        playerRef.current = new window.YT.Player(liveHost, {
          height: String(height),
          width: String(width),
          videoId: embed.videoId,
          playerVars: {
            autoplay: 0,
            controls: stageVisible ? 1 : 0,
            disablekb: stageVisible && canControlRef.current ? 0 : 1,
            fs: stageVisible ? 1 : 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            ...(embed.list ? { listType: "playlist", list: embed.list } : {}),
          },
          events: {
            onReady: (event) => {
              console.log("[YT onReady] initGen=", initGen, "current=", playerInitGenRef.current, "cancelled=", cancelled, "host children=", liveHost.childNodes.length, "host innerHTML length=", liveHost.innerHTML.length);
              if (cancelled || initGen !== playerInitGenRef.current) return;
              fitStagePlayerToHost(event.target, liveHost);
              event.target.setVolume(volume);
              const initialId =
                trackVideoId(snapshot.video_id) ??
                trackVideoId(readVideoData(event.target)?.video_id) ??
                trackVideoId(embed.videoId);
              loadedVideoId.current = initialId ?? embed.videoId;
              lastSyncedVideoId.current =
                trackVideoId(loadedVideoId.current) ?? loadedVideoId.current;
              lastTransportToken.current = "";
              setPlayerReady(true);
              setPlayerError(false);
              if (snapshot) {
                applyRemoteTransport(snapshot);
              }
            },
            onError: () => {
              if (!cancelled) setPlayerError(true);
            },
            onStateChange: (event) => {
              if (applyingRemote.current) return;
              const control = canControlRef.current;
              if (event.data === YT_PLAYING) {
                setLocalPlaying(true);
                if (control) {
                  syncCurrentTrack(true);
                }
              } else if (event.data === YT_PAUSED || event.data === YT_ENDED) {
                setLocalPlaying(false);
                if (control && event.data === YT_ENDED) {
                  window.setTimeout(() => syncCurrentTrack(true, true), 300);
                }
              } else if (event.data === YT_CUED && control) {
                syncCurrentTrack(true, true);
              }
            },
          },
        });
        console.log("[YT create] constructor returned", !!playerRef.current);

        resizeObserver = new ResizeObserver(() => {
          const player = playerRef.current;
          const box = playerHostRef.current;
          if (player && box) {
            fitStagePlayerToHost(player, box);
          }
        });
        resizeObserver.observe(liveHost);
      } catch (e) {
        console.log("[YT create] constructor error", e);
        if (!cancelled) setPlayerError(true);
      }
    };

    void loadYouTubeIframeAPI().then(() => {
      if (cancelled || initGen !== playerInitGenRef.current) {
        return;
      }
      createPlayer();
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      loadedVideoId.current = null;
      lastSyncedVideoId.current = null;
      lastTransportToken.current = "";
    };
  }, [
    active,
    applyRemoteTransport,
    playerHostElement,
    playerHostRef,
    playerSessionKey,
    stageVisible,
    syncCurrentTrack,
  ]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  const sendPlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!canControl || !player || !state) return;
    bumpLocalGuard();
    const pos = player.getCurrentTime();
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
      player.playVideo();
      setLocalPlaying(true);
      patch({ action: "play", position_sec: pos });
    } else {
      player.pauseVideo();
      setLocalPlaying(false);
      patch({ action: "pause", position_sec: pos });
    }
  }, [bumpLocalGuard, canControl, localPlaying, patch, setMusicCache, state]);

  const seekBy = useCallback(
    (delta: number) => {
      const player = playerRef.current;
      if (!canControl || !player || !state) return;
      bumpLocalGuard();
      const pos = Math.max(0, player.getCurrentTime() + delta);
      player.seekTo(pos, true);
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
    [bumpLocalGuard, canControl, localPlaying, patch, setMusicCache, state],
  );

  const skipPlaylist = useCallback(
    (direction: "next" | "prev") => {
      const player = playerRef.current;
      if (!canControl || !player || !state?.playlist_id) return;
      bumpLocalGuard(1500);
      if (direction === "next") {
        player.nextVideo();
      } else {
        player.previousVideo();
      }
      window.setTimeout(() => syncCurrentTrack(true, true), 450);
    },
    [bumpLocalGuard, canControl, state?.playlist_id, syncCurrentTrack],
  );

  const unlockPlayback = useCallback(() => {
    const player = playerRef.current;
    if (!state || !player) return;
    bumpLocalGuard();
    const pos = expectedPositionSec(state);
    if (pos > 0.5) {
      player.seekTo(pos, true);
    }
    player.playVideo();
    setLocalPlaying(true);
    if (canControl && state.playing !== true) {
      patch({ action: "play", position_sec: pos });
    }
  }, [bumpLocalGuard, canControl, patch, state]);

  const isPlaylist = Boolean(state?.playlist_id);

  return {
    localPlaying,
    isPlaylist,
    playerReady,
    playerError,
    sendPlayPause,
    seekBy,
    skipPlaylist,
    unlockPlayback,
  };
}
