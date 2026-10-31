import type { createApiClient } from "./index";

type Client = ReturnType<typeof createApiClient>;

export type AuthUser = {
  display_name: string;
  avatar_url?: string;
  email?: string;
  is_guest: boolean;
};

export const DEFAULT_GUEST_DISPLAY_NAME = "Guest";
export const DEFAULT_GUEST_AVATAR_URL = "/media/default-guest-avatar.gif";

export function resolveGuestAvatar(avatarUrl?: string | null): string {
  const trimmed = avatarUrl?.trim();
  return trimmed || DEFAULT_GUEST_AVATAR_URL;
}

export type RoomSummary = {
  id: string;
  name: string;
  description?: string;
  participant_count: number;
  is_live: boolean;
  has_preview?: boolean;
};

export type CreateRoomBody = {
  name: string;
  description?: string;
  visibility?: "public" | "private";
  password?: string;
  max_participants?: number;
};

export type CreateRoomResponse = {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  visibility: string;
};

export type Participant = {
  id: string;
  display_name: string;
  role: string;
  can_publish: boolean;
  muted: boolean;
  session_id: string;
};

export type ChatMessage = {
  id: string;
  body: string;
  sender_display_name: string;
  created_at: string;
  kind?: "system" | "user";
};

export type RoomMusicState = {
  active: boolean;
  platform?: string;
  media_type?: "mp4" | "hls";
  video_id?: string;
  playlist_id?: string;
  source_url?: string;
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  control_mode?: "owner_only" | "everyone";
  controller_session_id?: string;
  added_by_name?: string;
  playing?: boolean;
  position_sec?: number;
  state_at?: string;
  updated_at?: string;
  can_control?: boolean;
};

export type RoomMusicPatchBody = {
  action: "play" | "pause" | "seek" | "sync_track";
  position_sec?: number;
  video_id?: string;
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  playing?: boolean;
};

export type RoomEntryInfo = {
  id: string;
  name: string;
  description?: string;
  visibility: string;
  password_required: boolean;
  direct_join_allowed?: boolean;
  can_resume?: boolean;
  is_host?: boolean;
};

export type RoomCineState = {
  active: boolean;
  mode?: "catalog" | "direct";
  content_type?: "filme" | "serie" | "anime" | "dorama";
  media_id?: string;
  season?: number;
  episode?: number;
  embed_url?: string;
  source_url?: string;
  media_type?: "mp4" | "hls";
  title?: string;
  host_name?: string;
  playing?: boolean;
  position_sec?: number;
  state_at?: string;
  updated_at?: string;
  is_host?: boolean;
  can_control?: boolean;
};

export type RoomCineUpsertBody =
  | {
      mode: "catalog";
      content_type: "filme" | "serie" | "anime" | "dorama";
      media_id: string;
      season?: number;
      episode?: number;
      title?: string;
    }
  | {
      mode: "direct";
      url: string;
      title?: string;
    };

export type RoomCinePatchBody = {
  action: "play" | "pause" | "seek" | "prev_episode" | "next_episode" | "set_episode";
  position_sec?: number;
  season?: number;
  episode?: number;
};

export type CineCatalogItem = {
  imdb_id?: string;
  media_id: string;
  title: string;
  year?: number;
  type: "filme" | "serie" | "anime" | "dorama";
  poster?: string;
  imdb_rating?: string;
};

export type CineCatalogResponse = {
  items: CineCatalogItem[];
};

export type CineSeriesEpisode = {
  episode: number;
  title: string;
  thumbnail?: string;
};

export type CineSeriesSeason = {
  season: number;
  episodes: CineSeriesEpisode[];
};

export type CineSeriesMeta = {
  imdb_id: string;
  media_id: string;
  title: string;
  poster?: string;
  seasons: CineSeriesSeason[];
};

export type LiveKitTokenResponse = {
  token: string;
  url: string;
  room_name: string;
  identity: string;
};

export function createAuthApi(client: Client) {
  return {
    me: () => client.get<AuthUser>("/api/v1/auth/me"),
    guest: (display_name: string, avatar_url = "") =>
      client.post<AuthUser>("/api/v1/auth/guest", { display_name, avatar_url }),
    updateMe: (body: { display_name?: string; avatar_url?: string }) =>
      client.patch<AuthUser>("/api/v1/auth/me", body),
    logout: () => client.post<{ status: string }>("/api/v1/auth/logout"),
  };
}

export type OwnedRoom = {
  id: string;
  name: string;
  visibility: string;
  invite_code: string;
};

export type JoinRoomResponse = {
  room_id: string;
  participant_id: string;
  role: string;
  livekit?: LiveKitTokenResponse;
};

export function createRoomsApi(client: Client) {
  return {
    listPublic: () =>
      client.get<{ items: RoomSummary[]; total: number }>(
        "/api/v1/rooms?visibility=public",
      ),
    create: (body: CreateRoomBody) =>
      client.post<CreateRoomResponse>("/api/v1/rooms", body),
    get: (id: string) =>
      client.get<{
        id: string;
        name: string;
        description?: string;
        visibility: string;
        invite_code: string;
        password_required?: boolean;
      }>(`/api/v1/rooms/${id}`),
    entry: (id: string) =>
      client.get<RoomEntryInfo>(`/api/v1/rooms/${id}/entry`),
    preview: (id: string) =>
      client.get<RoomEntryInfo>(`/api/v1/rooms/${id}/preview`),
    join: (id: string, password?: string) =>
      client.post<JoinRoomResponse>(
        `/api/v1/rooms/${id}/join`,
        password ? { password } : {},
      ),
    joinByCode: (code: string, password?: string) =>
      client.post<JoinRoomResponse>(
        "/api/v1/rooms/join-by-code",
        { code, password: password ?? "" },
      ),
    leave: (id: string) =>
      client.post<{ status: string }>(`/api/v1/rooms/${id}/leave`),
    close: (id: string) =>
      client.delete<{ status: string }>(`/api/v1/rooms/${id}`),
    participants: (id: string) =>
      client.get<{ items: Participant[] }>(`/api/v1/rooms/${id}/participants`),
    livekitToken: (id: string) =>
      client.post<LiveKitTokenResponse>(`/api/v1/rooms/${id}/livekit-token`),
    messages: (id: string, limit = 50) =>
      client.get<{ items: ChatMessage[] }>(
        `/api/v1/rooms/${id}/messages?limit=${limit}`,
      ),
    sendMessage: (id: string, body: string) =>
      client.post<ChatMessage>(`/api/v1/rooms/${id}/messages`, { body }),
    getMusic: (id: string) =>
      client.get<RoomMusicState>(`/api/v1/rooms/${id}/music`),
    setMusic: (
      id: string,
      body: { url: string; control_mode: "owner_only" | "everyone"; title?: string },
    ) => client.post<RoomMusicState>(`/api/v1/rooms/${id}/music`, body),
    patchMusic: (id: string, body: RoomMusicPatchBody) =>
      client.patch<RoomMusicState>(`/api/v1/rooms/${id}/music`, body),
    clearMusic: (id: string) =>
      client.delete<RoomMusicState>(`/api/v1/rooms/${id}/music`),
    getCine: (id: string) => client.get<RoomCineState>(`/api/v1/rooms/${id}/cine`),
    setCine: (id: string, body: RoomCineUpsertBody) =>
      client.post<RoomCineState>(`/api/v1/rooms/${id}/cine`, body),
    patchCine: (id: string, body: RoomCinePatchBody) =>
      client.patch<RoomCineState>(`/api/v1/rooms/${id}/cine`, body),
    stopCine: (id: string) =>
      client.delete<RoomCineState>(`/api/v1/rooms/${id}/cine`),
    removeParticipant: (roomId: string, participantId: string) =>
      client.delete<{ status: string }>(
        `/api/v1/rooms/${roomId}/participants/${participantId}`,
      ),
    patchParticipant: (
      roomId: string,
      participantId: string,
      body: { can_publish?: boolean; muted?: boolean; role?: string },
    ) =>
      client.patch<{ status: string }>(
        `/api/v1/rooms/${roomId}/participants/${participantId}/permissions`,
        body,
      ),
    screenSignal: (roomId: string, action: "start" | "stop") =>
      client.post<{ status: string }>(`/api/v1/rooms/${roomId}/screen`, {
        action,
      }),
    uploadCover: (roomId: string, imageBase64: string) =>
      client.put<{ status: string }>(`/api/v1/rooms/${roomId}/cover`, {
        image_base64: imageBase64,
      }),
    listMine: () =>
      client.get<{ items: OwnedRoom[]; total: number }>("/api/v1/rooms/mine"),
  };
}

export function createCineApi(client: Client) {
  return {
    catalog: (params?: { category?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category && params.category !== "all") {
        q.set("category", params.category);
      }
      const search = params?.search?.trim();
      if (search) {
        q.set("search", search);
      }
      const qs = q.toString();
      return client.get<CineCatalogResponse>(`/api/v1/cine/catalog${qs ? `?${qs}` : ""}`);
    },
    meta: (params: { imdbId?: string; mediaId?: string; type?: "series" | "movie" }) => {
      const q = new URLSearchParams();
      q.set("type", params.type ?? "series");
      if (params.imdbId?.trim()) {
        q.set("imdbId", params.imdbId.trim());
      }
      if (params.mediaId?.trim()) {
        q.set("mediaId", params.mediaId.trim());
      }
      return client.get<CineSeriesMeta>(`/api/v1/cine/meta?${q.toString()}`);
    },
  };
}

export function publicRoomCoverPath(roomId: string): string {
  return `/api/v1/rooms/${roomId}/cover`;
}

/** Same-origin playback URL for direct watch party (bypasses CDN CORS in the browser). */
export function roomMusicStreamPath(roomId: string): string {
  return `/api/v1/rooms/${roomId}/music/stream`;
}

export function roomCineStreamPath(roomId: string): string {
  return `/api/v1/rooms/${roomId}/cine/stream`;
}

export type RealtimeEvent = {
  type: string;
  payload: Record<string, unknown>;
};
