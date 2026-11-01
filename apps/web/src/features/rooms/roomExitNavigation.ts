import type { QueryClient } from "@tanstack/react-query";
import type { NavigateFunction } from "react-router-dom";

/** Public catalog — safe for guests without OAuth. */
export const ROOM_CLOSED_EXIT_PATH = "/rooms";

export type RoomClosedFlashState = {
  roomClosedByHost?: boolean;
};

export function clearRoomLiveQueries(queryClient: QueryClient, roomId: string) {
  queryClient.removeQueries({ queryKey: ["livekit", roomId] });
  queryClient.removeQueries({ queryKey: ["participants", roomId] });
  queryClient.removeQueries({ queryKey: ["room-entry", roomId] });
}

export function navigateAfterRoomClosedByHost(
  navigate: NavigateFunction,
  queryClient: QueryClient,
  roomId: string,
) {
  clearRoomLiveQueries(queryClient, roomId);
  navigate(ROOM_CLOSED_EXIT_PATH, {
    replace: true,
    state: { roomClosedByHost: true } satisfies RoomClosedFlashState,
  });
}
