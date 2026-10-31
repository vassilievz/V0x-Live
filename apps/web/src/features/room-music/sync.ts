import type { RoomMusicState } from "@v0xlive/api-client";

export function expectedPositionSec(state: RoomMusicState, nowMs = Date.now()): number {
  if (!state.playing || !state.state_at) {
    return state.position_sec ?? 0;
  }
  const base = state.position_sec ?? 0;
  const at = new Date(state.state_at).getTime();
  if (Number.isNaN(at)) return base;
  return base + Math.max(0, (nowMs - at) / 1000);
}
