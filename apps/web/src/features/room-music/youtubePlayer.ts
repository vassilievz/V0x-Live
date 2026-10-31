let apiReady: Promise<void> | null = null;

export function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.YT?.Player) {
    return Promise.resolve();
  }
  if (apiReady) {
    return apiReady;
  }
  apiReady = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiReady;
}

export type YouTubeVideoData = {
  video_id: string;
  title: string;
  author: string;
};

export type YouTubeLoadOptions = {
  videoId: string;
  startSeconds?: number;
  listType?: "playlist";
  list?: string;
};

export type YouTubePlayerHandle = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  setVolume: (volume: number) => void;
  setSize: (width: number, height: number) => void;
  getPlayerState: () => number;
  getVideoData: () => YouTubeVideoData;
  loadVideoById: (videoIdOrOptions: string | YouTubeLoadOptions, startSeconds?: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  destroy: () => void;
};

export function measureStagePlayerSize(host: HTMLElement): { width: number; height: number } {
  const rect = host.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width) || host.clientWidth || 640);
  const height = Math.max(180, Math.floor(rect.height) || host.clientHeight || 360);
  return { width, height };
}

export function fitStagePlayerToHost(
  player: YouTubePlayerHandle,
  host: HTMLElement,
): { width: number; height: number } {
  const { width, height } = measureStagePlayerSize(host);
  try {
    player.setSize(width, height);
  } catch {
    /* player not ready */
  }
  return { width, height };
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string;
          width?: string;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YouTubePlayerHandle }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayerHandle }) => void;
            onError?: (event: { data: number; target: YouTubePlayerHandle }) => void;
          };
        },
      ) => YouTubePlayerHandle;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YT_PLAYING = 1;
export const YT_PAUSED = 2;
export const YT_BUFFERING = 3;
export const YT_CUED = 5;

export function readVideoData(player: YouTubePlayerHandle): YouTubeVideoData | null {
  try {
    const data = player.getVideoData();
    if (!data?.video_id) return null;
    return data;
  } catch {
    return null;
  }
}

export function loadRemoteVideo(
  player: YouTubePlayerHandle,
  state: { video_id?: string; playlist_id?: string },
  startSeconds: number,
): void {
  const videoId = state.video_id;
  if (!videoId) return;

  if (state.playlist_id) {
    player.loadVideoById({
      videoId,
      listType: "playlist",
      list: state.playlist_id,
      startSeconds,
    });
    return;
  }

  player.loadVideoById(videoId, startSeconds);
}
