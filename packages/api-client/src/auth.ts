import type { createApiClient } from "./index";

type Client = ReturnType<typeof createApiClient>;

export type AuthUser = {
  display_name: string;
  avatar_url?: string;
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
    preview: (id: string) =>
      client.get<{
        id: string;
        name: string;
        description?: string;
        visibility: string;
        password_required: boolean;
      }>(`/api/v1/rooms/${id}/preview`),
    join: (id: string, password?: string) =>
      client.post<{ room_id: string; participant_id: string; role: string }>(
        `/api/v1/rooms/${id}/join`,
        password ? { password } : {},
      ),
    joinByCode: (code: string, password?: string) =>
      client.post<{ room_id: string; participant_id: string; role: string }>(
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
  };
}

export type RealtimeEvent = {
  type: string;
  payload: Record<string, unknown>;
};
