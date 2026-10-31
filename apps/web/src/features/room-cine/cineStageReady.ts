import type { RoomCineState } from "@v0xlive/api-client";

/** True when Cine should replace the LiveKit viewport (has something to render). */
export function cineStageReady(state: RoomCineState | undefined): boolean {
  if (!state?.active) {
    return false;
  }
  if (state.mode === "catalog") {
    return Boolean(state.embed_url?.trim());
  }
  if (state.mode === "direct") {
    return Boolean(state.source_url?.trim());
  }
  return false;
}
