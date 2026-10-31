export type YouTubeParseResult = {
  videoId?: string;
  playlistId?: string;
};

export function parseYouTubeUrl(raw: string): YouTubeParseResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"].includes(host)) {
      return null;
    }
    const result: YouTubeParseResult = {};
    if (host === "youtu.be") {
      result.videoId = url.pathname.replace(/^\//, "").split("/")[0] || undefined;
    } else {
      result.videoId = url.searchParams.get("v") ?? undefined;
      if (!result.videoId && url.pathname.startsWith("/shorts/")) {
        result.videoId = url.pathname.replace("/shorts/", "").split("/")[0];
      }
      if (!result.videoId && url.pathname.startsWith("/embed/")) {
        result.videoId = url.pathname.replace("/embed/", "").split("/")[0];
      }
      const list = url.searchParams.get("list");
      if (list) result.playlistId = list;
    }
    if (!result.videoId && !result.playlistId) return null;
    return result;
  } catch {
    return null;
  }
}

export function buildYouTubeEmbedId(state: {
  video_id?: string;
  playlist_id?: string;
}): { videoId: string; list?: string } | null {
  if (state.video_id) {
    return { videoId: state.video_id, list: state.playlist_id };
  }
  if (state.playlist_id) {
    return { videoId: "videoseries", list: state.playlist_id };
  }
  return null;
}

/** URL de embed manual (legado); o palco usa `YT.Player` via `youtubePlayer.ts`. */
export function buildYouTubeWatchEmbedUrl(
  state: { video_id?: string; playlist_id?: string },
  opts: { autoplay?: boolean; controls?: boolean; startSec?: number } = {},
): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const embed = buildYouTubeEmbedId(state);
  if (!embed) {
    return null;
  }
  const params = new URLSearchParams({
    enablejsapi: "1",
    origin: window.location.origin,
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    autoplay: opts.autoplay ? "1" : "0",
    controls: opts.controls ? "1" : "0",
    disablekb: opts.controls ? "0" : "1",
    fs: "0",
  });
  if (opts.startSec != null && opts.startSec > 0 && !embed.list) {
    params.set("start", String(Math.floor(opts.startSec)));
  }
  if (embed.list) {
    params.set("list", embed.list);
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`;
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(embed.videoId)}?${params.toString()}`;
}
