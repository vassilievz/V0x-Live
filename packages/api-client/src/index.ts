export type ApiErrorBody = {
  error: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message ?? body.error);
    this.name = "ApiError";
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  credentials?: RequestCredentials;
};

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, credentials = "include" } = options;

  async function request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await parseJson<ApiErrorBody>(res);
      throw new ApiError(res.status, body);
    }

    return parseJson<T>(res);
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "PATCH",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "PUT",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}

export type HealthResponse = { status: string; version?: string };

export function createHealthApi(client: ReturnType<typeof createApiClient>) {
  return {
    check: () => client.get<HealthResponse>("/health"),
    ready: () => client.get<{ ready: boolean }>("/ready"),
  };
}

export { createAuthApi, createRoomsApi, createCineApi, DEFAULT_GUEST_DISPLAY_NAME, DEFAULT_GUEST_AVATAR_URL, resolveGuestAvatar, publicRoomCoverPath, roomMusicStreamPath, roomCineStreamPath } from "./auth";
export { createStatsApi, createPresenceApi } from "./stats";
export type { OnlineStatsResponse } from "./stats";
export type {
  AuthUser,
  RoomSummary,
  CreateRoomBody,
  CreateRoomResponse,
  Participant,
  ChatMessage,
  LiveKitTokenResponse,
  JoinRoomResponse,
  RealtimeEvent,
  RoomMusicState,
  RoomMusicPatchBody,
  RoomCineState,
  RoomCineUpsertBody,
  RoomCinePatchBody,
  RoomEntryInfo,
  CineCatalogItem,
  CineCatalogResponse,
  CineSeriesMeta,
  CineSeriesSeason,
  CineSeriesEpisode,
} from "./auth";
