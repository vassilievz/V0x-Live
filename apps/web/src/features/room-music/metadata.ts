import type { RoomMusicState } from "@v0xlive/api-client";

export function musicThumbnailUrl(
  state: Pick<RoomMusicState, "video_id" | "thumbnail_url">,
): string | undefined {
  const fromApi = state.thumbnail_url?.trim();
  if (fromApi) return fromApi;
  if (state.video_id) {
    return `https://i.ytimg.com/vi/${state.video_id}/hqdefault.jpg`;
  }
  return undefined;
}
