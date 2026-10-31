import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomMusicPatchBody, RoomMusicState } from "@v0xlive/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { buildYouTubeEmbedId } from "@/features/room-music/youtube";
import { musicThumbnailUrl } from "@/features/room-music/metadata";
import { expectedPositionSec } from "@/features/room-music/sync";
import { mergeMusicState, transportSyncToken } from "@/features/room-music/playerSync";
import {
  YT_CUED,
  YT_PLAYING,
  loadRemoteVideo,
  loadYouTubeIframeAPI,
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
  frameId: string;
  volume: number;
  state: RoomMusicState | undefined;
  active: boolean;
  canControl: boolean;
  patch: PatchFn;
  queryClient: QueryClient;
};

export function useRoomMusicYouTube({
  roomId,
  frameId,
  volume,
  state,
  active,
  canControl,
  patch,
  queryClient,
}: Args) {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const applyingRemote = useRef(false);
  const localGuardUntil = useRef(0);
  const lastTransportToken = useRef("");
  const loadedVideoId = useRef<string | null>(null);
  const lastSyncedVideoId = useRef<string | null>(null);
  const syncTrackInFlight = useRef(false);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

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
    if (!active || !state || !playerSessionKey) {
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      return;
    }

    const embed = buildYouTubeEmbedId(state);
    if (!embed) return;

    let cancelled = false;
    void loadYouTubeIframeAPI().then(() => {
      if (cancelled || !window.YT || playerRef.current) return;

      const snapshot = state;
      playerRef.current = new window.YT.Player(frameId, {
        height: "1",
        width: "1",
        videoId: embed.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          ...(embed.list ? { listType: "playlist", list: embed.list } : {}),
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volume);
            const initialId =
              trackVideoId(snapshot.video_id) ??
              trackVideoId(readVideoData(event.target)?.video_id) ??
              trackVideoId(embed.videoId);
            loadedVideoId.current = initialId ?? embed.videoId;
            lastSyncedVideoId.current = trackVideoId(loadedVideoId.current) ?? loadedVideoId.current;
            lastTransportToken.current = transportSyncToken(snapshot);
            if (snapshot.playing) {
              const pos = expectedPositionSec(snapshot);
              event.target.seekTo(pos, true);
              event.target.playVideo();
              setLocalPlaying(true);
            }
            setPlayerReady(true);
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
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
      loadedVideoId.current = null;
      lastSyncedVideoId.current = null;
      lastTransportToken.current = "";
    };
  }, [active, frameId, playerSessionKey, syncCurrentTrack]);

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

  const isPlaylist = Boolean(state?.playlist_id);

  return {
    localPlaying,
    isPlaylist,
    sendPlayPause,
    seekBy,
    skipPlaylist,
  };
}
