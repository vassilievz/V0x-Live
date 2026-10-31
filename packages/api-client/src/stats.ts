import type { createApiClient } from "./index";

type Client = ReturnType<typeof createApiClient>;

export type OnlineStatsResponse = {
  online: number;
};

export function createStatsApi(client: Client) {
  return {
    online: () => client.get<OnlineStatsResponse>("/api/v1/stats/online"),
  };
}

export function createPresenceApi(client: Client) {
  return {
    heartbeat: () =>
      client.post<{ status: string }>("/api/v1/presence/heartbeat"),
  };
}
