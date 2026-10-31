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
import type { RealtimeEvent, RoomCinePatchBody, RoomCineState } from "@v0xlive/api-client";
import { roomsApi } from "@/lib/api";
import { soundEffects } from "@/utils/soundEffects";
import { useRoomCineDirect } from "@/features/room-cine/useRoomCineDirect";

type DirectEngine = ReturnType<typeof useRoomCineDirect>;

type RoomCineContextValue = {
  roomId: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  stageShellRef: RefObject<HTMLDivElement | null>;
  volume: number;
  setVolume: (value: number) => void;
  state: RoomCineState | undefined;
  isActive: boolean;
  isCatalog: boolean;
  isDirect: boolean;
  canControl: boolean;
  direct: DirectEngine;
  patch: (body: RoomCinePatchBody) => void;
  stop: () => void;
  requestStageFullscreen: () => void;
};

const RoomCineContext = createContext<RoomCineContextValue | null>(null);

type ProviderProps = {
  roomId: string;
  lastEvent: RealtimeEvent | null;
  children: ReactNode;
};

export function RoomCineProvider({ roomId, lastEvent, children }: ProviderProps) {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(70);

  const cine = useQuery({
    queryKey: ["room-cine", roomId],
    queryFn: () => roomsApi.getCine(roomId),
  });

  useEffect(() => {
    if (lastEvent?.type === "room.cine.updated") {
      queryClient.setQueryData(["room-cine", roomId], lastEvent.payload as RoomCineState);
    }
  }, [lastEvent, queryClient, roomId]);

  const patchMutation = useMutation({
    mutationFn: (body: RoomCinePatchBody) => roomsApi.patchCine(roomId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-cine", roomId], data);
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => roomsApi.stopCine(roomId),
    onSuccess: (data) => {
      queryClient.setQueryData(["room-cine", roomId], data);
    },
  });

  const state = cine.data;
  const isActive = state?.active === true;
  const isCatalog = isActive && state?.mode === "catalog";
  const isDirect = isActive && state?.mode === "direct";
  const canControl = state?.can_control === true;
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      soundEffects.playCineStart();
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  const direct = useRoomCineDirect({
    roomId,
    videoRef,
    volume,
    state,
    active: isDirect,
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
    (): RoomCineContextValue => ({
      roomId,
      videoRef,
      stageShellRef,
      volume,
      setVolume,
      state,
      isActive,
      isCatalog,
      isDirect,
      canControl,
      direct,
      patch: patchMutation.mutate,
      stop: stopMutation.mutate,
      requestStageFullscreen,
    }),
    [
      canControl,
      direct,
      isActive,
      isCatalog,
      isDirect,
      patchMutation.mutate,
      requestStageFullscreen,
      roomId,
      state,
      stopMutation.mutate,
      volume,
    ],
  );

  return <RoomCineContext.Provider value={value}>{children}</RoomCineContext.Provider>;
}

export function useRoomCine(): RoomCineContextValue | null {
  return useContext(RoomCineContext);
}

export function useRoomCineRequired(): RoomCineContextValue {
  const ctx = useContext(RoomCineContext);
  if (!ctx) {
    throw new Error("RoomCineProvider missing");
  }
  return ctx;
}
