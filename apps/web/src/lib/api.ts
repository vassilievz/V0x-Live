import {
  createAuthApi,
  createApiClient,
  createHealthApi,
  createPresenceApi,
  createRoomsApi,
  createCineApi,
  createStatsApi,
} from "@v0xlive/api-client";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

export const api = createApiClient({ baseUrl });
export const authApi = createAuthApi(api);
export const roomsApi = createRoomsApi(api);
export const cineApi = createCineApi(api);
export const healthApi = createHealthApi(api);
export const statsApi = createStatsApi(api);
export const presenceApi = createPresenceApi(api);
export { ApiError } from "@v0xlive/api-client";

export function getWsUrl(roomId: string): string {
  const path = `/api/v1/realtime/ws?room_id=${encodeURIComponent(roomId)}`;
  const wsBase = import.meta.env.VITE_WS_URL?.replace(/\/$/, "");
  if (wsBase) {
    return `${wsBase}${path}`;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}

export function getLiveKitUrl(): string {
  return import.meta.env.VITE_LIVEKIT_URL ?? "ws://localhost:7880";
}

/** Best-effort leave when the tab closes so empty rooms can be purged. */
export function roomLeaveKeepalive(roomId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const path = `/api/v1/rooms/${encodeURIComponent(roomId)}/leave`;
  const url = base ? `${base}${path}` : path;
  void fetch(url, { method: "POST", credentials: "include", keepalive: true });
}
