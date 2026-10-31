import type { RoomCineState } from "@v0xlive/api-client";
import { expectedPositionSec } from "@/features/room-music/sync";

export function transportCineSyncToken(state: RoomCineState): string {
  const pos = Math.floor(expectedPositionSec(state));
  return [
    state.mode ?? "",
    state.source_url ?? "",
    state.media_type ?? "",
    state.embed_url ?? "",
    state.playing ? "1" : "0",
    String(pos),
    state.state_at ?? "",
  ].join("|");
}

export function mergeCineState(
  prev: RoomCineState | undefined,
  patch: Partial<RoomCineState>,
): RoomCineState {
  return {
    active: patch.active ?? prev?.active ?? true,
    ...prev,
    ...patch,
  };
}
