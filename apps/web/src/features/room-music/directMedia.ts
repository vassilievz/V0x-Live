import { parseYouTubeUrl } from "@/features/room-music/youtube";

const MAX_URL_LEN = 2048;

export type DirectMediaKind = "mp4" | "hls";

export function parseDirectMediaUrl(raw: string): { url: string; mediaType: DirectMediaKind } | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > MAX_URL_LEN) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || !parsed.hostname) {
    return null;
  }

  const path = parsed.pathname.toLowerCase();
  if (path.endsWith(".mp4")) {
    return { url: trimmed, mediaType: "mp4" };
  }
  if (path.endsWith(".m3u8")) {
    return { url: trimmed, mediaType: "hls" };
  }
  return null;
}

export function parseRoomMediaUrl(
  raw: string,
): { kind: "youtube" } | { kind: "direct"; mediaType: DirectMediaKind; url: string } | null {
  if (parseYouTubeUrl(raw)) {
    return { kind: "youtube" };
  }
  const direct = parseDirectMediaUrl(raw);
  if (direct) {
    return { kind: "direct", mediaType: direct.mediaType, url: direct.url };
  }
  return null;
}
