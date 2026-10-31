import {
  createAuthApi,
  createApiClient,
  createHealthApi,
  createRoomsApi,
} from "@v0xlive/api-client";

const baseUrl = import.meta.env.VITE_API_URL ?? "";

export const api = createApiClient({ baseUrl });
export const authApi = createAuthApi(api);
export const roomsApi = createRoomsApi(api);
export const healthApi = createHealthApi(api);
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
