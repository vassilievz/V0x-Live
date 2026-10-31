import type { RoomMusicState } from "@v0xlive/api-client";
import { expectedPositionSec } from "@/features/room-music/sync";

/** Token for play/pause/seek sync — excludes title/thumbnail to avoid redundant seeks. */
export function transportSyncToken(state: RoomMusicState): string {
  const pos = Math.floor(expectedPositionSec(state));
  return [
    state.video_id ?? "",
    state.playlist_id ?? "",
    state.playing ? "1" : "0",
    String(pos),
    state.state_at ?? "",
  ].join("|");
}

export function mergeMusicState(
  prev: RoomMusicState | undefined,
  patch: Partial<RoomMusicState>,
): RoomMusicState {
  return {
    active: patch.active ?? prev?.active ?? true,
    ...prev,
    ...patch,
  };
}
