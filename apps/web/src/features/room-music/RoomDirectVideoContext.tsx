import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeEvent, RoomMusicPatchBody, RoomMusicState } from "@v0xlive/api-client";
import { roomsApi } from "@/lib/api";
import { useRoomMusicDirect } from "@/features/room-music/useRoomMusicDirect";

type DirectEngine = ReturnType<typeof useRoomMusicDirect>;

type RoomDirectVideoContextValue = {
  roomId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  videoRef: RefObject<HTMLVideoElement | null>;
  stageShellRef: RefObject<HTMLDivElement | null>;
  volume: number;
  setVolume: (value: number) => void;
  state: RoomMusicState | undefined;
  isDirectActive: boolean;
  canControl: boolean;
  canRemoveMusic: boolean;
  direct: DirectEngine;
  patch: (body: RoomMusicPatchBody) => void;
  clear: () => void;
  requestStageFullscreen: () => void;
};

const RoomDirectVideoContext = createContext<RoomDirectVideoContextValue | null>(null);

type ProviderProps = {
  roomId: string;
  lastEvent: RealtimeEvent | null;
  viewerRole?: string | null;
  children: ReactNode;
};

export function RoomDirectVideoProvider({ roomId, lastEvent, viewerRole, children }: ProviderProps) {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(70);

  const music = useQuery({
    queryKey: ["room-music", roomId],
    queryFn: () => roomsApi.getMusic(roomId),
  });

  useEffect(() => {
    if (lastEvent?.type === "room.music.updated") {
      queryClient.setQueryData(["room-music", roomId], lastEvent.payload as RoomMusicState);
    }
  }, [lastEvent, queryClient, roomId]);

  const patchMutation = useMutation({
    mutationFn: (body: RoomMusicPatchBody) => roomsApi.patchMusic(roomId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-music", roomId], data);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => roomsApi.clearMusic(roomId),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-music", roomId], data);
    },
  });

  const state = music.data;
  const isDirectActive = state?.active === true && state.platform === "direct";
  const canControl = state?.can_control === true;
  const canRemoveMusic = canControl || viewerRole === "host";

  const direct = useRoomMusicDirect({
    roomId,
    videoRef,
    volume,
    state,
    active: isDirectActive,
    canControl,
    patch: patchMutation.mutate,
    queryClient,
  });

  const requestStageFullscreen = useCallback(() => {
    const target = stageShellRef.current ?? videoRef.current;
    if (!target) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void target.requestFullscreen?.();
  }, []);

  const value = useMemo(
    (): RoomDirectVideoContextValue => ({
      roomId,
      queryClient,
      videoRef,
      stageShellRef,
      volume,
      setVolume,
      state,
      isDirectActive,
      canControl,
      canRemoveMusic,
      direct,
      patch: patchMutation.mutate,
      clear: clearMutation.mutate,
      requestStageFullscreen,
    }),
    [
      canControl,
      canRemoveMusic,
      clearMutation.mutate,
      direct,
      isDirectActive,
      patchMutation.mutate,
      queryClient,
      requestStageFullscreen,
      roomId,
      state,
      volume,
    ],
  );

  return (
    <RoomDirectVideoContext.Provider value={value}>{children}</RoomDirectVideoContext.Provider>
  );
}

export function useRoomDirectVideo(): RoomDirectVideoContextValue | null {
  return useContext(RoomDirectVideoContext);
}

export function useRoomDirectVideoRequired(): RoomDirectVideoContextValue {
  const ctx = useContext(RoomDirectVideoContext);
  if (!ctx) {
    throw new Error("RoomDirectVideoProvider missing");
  }
  return ctx;
}
