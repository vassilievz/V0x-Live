import { describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";
import {
  ROOM_CLOSED_EXIT_PATH,
  clearRoomLiveQueries,
  navigateAfterRoomClosedByHost,
} from "./roomExitNavigation";

describe("roomExitNavigation", () => {
  it("routes closed rooms to public catalog", () => {
    expect(ROOM_CLOSED_EXIT_PATH).toBe("/rooms");
  });

  it("clears live room queries", () => {
    const removeQueries = vi.fn();
    const queryClient = { removeQueries } as unknown as QueryClient;
    clearRoomLiveQueries(queryClient, "abc123");
    expect(removeQueries).toHaveBeenCalledTimes(3);
  });

  it("navigates with flash state", () => {
    const navigate = vi.fn();
    const removeQueries = vi.fn();
    const queryClient = { removeQueries } as unknown as QueryClient;
    navigateAfterRoomClosedByHost(navigate, queryClient, "room1");
    expect(navigate).toHaveBeenCalledWith("/rooms", {
      replace: true,
      state: { roomClosedByHost: true },
    });
  });
});
