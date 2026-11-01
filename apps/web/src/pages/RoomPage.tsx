import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff } from "lucide-react";
import { Button } from "@v0xlive/ui";
import { ApiError, roomsApi } from "@/lib/api";
import type { JoinRoomResponse, LiveKitTokenResponse } from "@v0xlive/api-client";
import { cn } from "@/lib/cn";
import { ensureGuestSession, syncSessionUser } from "@/lib/guestSession";
import { isReloadNavigation } from "@/lib/navigationType";
import { soundEffects } from "@/utils/soundEffects";
import { RoomEntryLoading } from "@/features/rooms/components/RoomEntryLoading";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useRoomPageUnloadLeave } from "@/hooks/useRoomPageUnloadLeave";
import { LiveKitStage } from "@/features/streaming/components/LiveKitStage";
import { RoomDirectVideoProvider } from "@/features/room-music/RoomDirectVideoContext";
import { RoomCineProvider } from "@/features/room-cine/RoomCineContext";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { RoomAccessGate } from "@/features/rooms/components/RoomAccessGate";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import {
  ParticipantsPanel,
} from "@/features/participants/components/ParticipantsPanel";
import { RoomStageShell } from "@/features/rooms/components/RoomStageShell";
import {
  mayAutoJoinRoomEntry,
  needsNickEntryGate,
  needsRoomInviteGate,
} from "@/features/rooms/roomEntryPolicy";
import {
  actionLink,
  actionLinkPill,
  homeBentoPanel,
  homeCellCode,
  homeSectionTitle,
  roomStageAlert,
  roomStagePlaceholder,
  roomStagePlaceholderMuted,
  roomAppRoot,
  sitePanel,
} from "@/ui";

type RoomLocationState = {
  prejoin?: JoinRoomResponse;
};

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [side, setSide] = useState<"chat" | "people">("chat");
  const [mobilePanel, setMobilePanel] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const autoJoinDone = useRef(false);
  const prejoinApplied = useRef(false);
  const joinedRef = useRef(false);

  const session = useSessionUser({ bootstrapGuest: true });

  const entry = useQuery({
    queryKey: ["room-entry", roomId],
    queryFn: () => roomsApi.entry(roomId!),
    enabled: Boolean(roomId) && session.isFetched,
    staleTime: 0,
  });

  const roomMeta = useQuery({
    queryKey: ["room-preview-public", roomId],
    queryFn: () => roomsApi.preview(roomId!),
    enabled: Boolean(roomId) && entry.data?.visibility === "public",
    staleTime: 60_000,
    retry: false,
  });

  const hasSession = session.isSuccess;
  const entryInfo = entry.data;

  const applyJoinSuccess = (data: JoinRoomResponse) => {
    setRole(data.role);
    setJoined(true);
    joinedRef.current = true;
    if (data.livekit && roomId) {
      queryClient.setQueryData<LiveKitTokenResponse>(["livekit", roomId], data.livekit);
    }
    void queryClient.invalidateQueries({ queryKey: ["participants", roomId] });
    if (!isReloadNavigation()) {
      soundEffects.playJoin();
    }
  };

  const join = useMutation({
    mutationFn: (password?: string) => roomsApi.join(roomId!, password),
    onSuccess: (data) => {
      applyJoinSuccess(data);
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const { mutate: joinRoom, reset: resetJoin } = join;

  useEffect(() => {
    autoJoinDone.current = false;
    prejoinApplied.current = false;
    setJoined(false);
    joinedRef.current = false;
    setRole(null);
    resetJoin();
  }, [roomId, resetJoin]);

  useEffect(() => {
    if (!roomId || joined || prejoinApplied.current) {
      return;
    }
    const prejoin = (location.state as RoomLocationState | null)?.prejoin;
    if (!prejoin?.role) {
      return;
    }
    prejoinApplied.current = true;
    autoJoinDone.current = true;
    applyJoinSuccess(prejoin);
    window.history.replaceState(null, "", location.pathname + location.search);
  }, [roomId, joined, location.pathname, location.search, location.state]);

  useEffect(() => {
    if (!roomId || joined || join.isPending || autoJoinDone.current) {
      return;
    }
    if (!session.isSuccess || !entryInfo) {
      return;
    }
    if (!mayAutoJoinRoomEntry(entryInfo, session.data, hasSession)) {
      return;
    }
    autoJoinDone.current = true;
    joinRoom(undefined);
  }, [roomId, joined, session.isSuccess, session.data, hasSession, entryInfo, join.isPending, joinRoom]);

  useQuery({
    queryKey: ["participants", roomId],
    queryFn: () => roomsApi.participants(roomId!),
    enabled: !!roomId && joined,
    staleTime: 0,
  });

  const cachedLivekit = roomId
    ? queryClient.getQueryData<LiveKitTokenResponse>(["livekit", roomId])
    : undefined;

  const livekit = useQuery({
    queryKey: ["livekit", roomId],
    queryFn: () => roomsApi.livekitToken(roomId!),
    enabled: !!roomId && joined && !cachedLivekit,
    retry: 2,
  });

  const livekitSession =
    livekit.data ??
    cachedLivekit ??
    (join.data?.livekit
      ? { token: join.data.livekit.token, url: join.data.livekit.url }
      : undefined);

  const hostRoomDetails = useQuery({
    queryKey: ["room", roomId, "host-details"],
    queryFn: () => roomsApi.get(roomId!),
    enabled: !!roomId && joined && role === "host",
    staleTime: 60_000,
  });

  const { connected, lastEvent } = useRoomSocket(roomId, joined);
  useRoomPageUnloadLeave(roomId, joined);

  useEffect(() => {
    if (lastEvent?.type !== "room.participant.joined") {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["participants", roomId] });
  }, [lastEvent, queryClient, roomId]);

  const leave = useMutation({
    mutationFn: async () => {
      try {
        await roomsApi.leave(roomId!);
        return;
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) {
          throw err;
        }
        await syncSessionUser(queryClient);
        await ensureGuestSession(queryClient);
        try {
          await roomsApi.leave(roomId!);
        } catch (retryErr) {
          if (retryErr instanceof ApiError && (retryErr.status === 401 || retryErr.status === 404)) {
            return;
          }
          throw retryErr;
        }
      }
    },
    onSettled: () => {
      soundEffects.playLeave();
      setJoined(false);
      joinedRef.current = false;
      if (roomId) {
        queryClient.removeQueries({ queryKey: ["livekit", roomId] });
      }
      navigate("/dashboard");
    },
  });

  const closeRoom = useMutation({
    mutationFn: () => roomsApi.close(roomId!),
    onSuccess: () => navigate("/dashboard"),
  });

  useEffect(() => {
    document.title = `${t("meta.siteTitle")} | ${entryInfo?.name ?? roomMeta.data?.name ?? t("room.liveTitle")}`;
  }, [entryInfo?.name, roomMeta.data?.name, t, i18n.language]);

  useEffect(() => {
    if (lastEvent?.type !== "room.closed") {
      return;
    }
    setJoined(false);
    navigate("/dashboard", { replace: true });
  }, [lastEvent, navigate]);

  if (!roomId) {
    return null;
  }

  const roomName = entryInfo?.name ?? roomMeta.data?.name ?? t("room.defaultName");
  const isPublicRoom = entryInfo?.visibility === "public";
  const metaReady =
    !isPublicRoom ||
    Boolean(entryInfo) ||
    Boolean(roomMeta.data) ||
    roomMeta.isError;
  const entryReady = session.isFetched;
  const waitingSession = !joined && !entryReady;
  const needsInviteGate = entryInfo ? needsRoomInviteGate(entryInfo) : false;
  const needsNickGate = entryInfo
    ? needsNickEntryGate(entryInfo, session.data, hasSession)
    : !hasSession && metaReady && !roomMeta.isError;

  const showGate =
    !joined &&
    !join.isPending &&
    !waitingSession &&
    (needsNickGate ||
      needsInviteGate ||
      (entryInfo?.password_required ?? roomMeta.data?.password_required) === true);

  const showStage = joined || join.isPending || join.isError;

  if (waitingSession && !joined) {
    return <RoomEntryLoading />;
  }

  if (roomMeta.isError && !entryInfo) {
    return (
      <SiteCatalogShell>
        <section className={cn(homeBentoPanel, sitePanel)}>
          <span className={homeCellCode}>RL-ERR</span>
          <h1 className={homeSectionTitle}>{t("room.errorTitle")}</h1>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.65] text-muted">{t("room.errorBody")}</p>
          <Link to="/rooms" className={cn(actionLink, actionLinkPill, "mt-8 inline-flex")}>
            {t("room.backToRooms")}
          </Link>
        </section>
      </SiteCatalogShell>
    );
  }

  if (showGate) {
    return (
      <RoomAccessGate
        roomId={roomId}
        roomName={roomName}
        passwordRequired={entryInfo?.password_required ?? roomMeta.data?.password_required ?? false}
        inviteCodeRequired={needsInviteGate}
        hasSession={hasSession}
        sessionUser={session.data}
        onJoined={(data) => {
          void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          applyJoinSuccess(data);
        }}
      />
    );
  }

  if (!showStage) {
    return (
      <RoomEntryLoading message={join.isPending ? t("room.joining") : t("room.loading")} />
    );
  }

  return (
    <div className={roomAppRoot}>
    <RoomDirectVideoProvider roomId={roomId} lastEvent={lastEvent} viewerRole={role}>
    <RoomCineProvider roomId={roomId} lastEvent={lastEvent}>
    <RoomStageShell
      roomName={roomName}
      connected={connected}
      side={side}
      onSideChange={setSide}
      mobileRailOpen={mobilePanel}
      onMobileRailToggle={() => setMobilePanel((v) => !v)}
      onMobileRailClose={() => setMobilePanel(false)}
      role={role}
      onLeave={() => leave.mutate()}
      leavePending={leave.isPending}
      onCloseRoom={role === "host" ? () => closeRoom.mutate() : undefined}
      closeRoomPending={closeRoom.isPending}
      hostShareRoomId={role === "host" ? roomId : undefined}
      hostInviteCode={hostRoomDetails.data?.invite_code}
      hostRoomPrivate={
        (hostRoomDetails.data?.visibility ?? entryInfo?.visibility ?? roomMeta.data?.visibility ?? "public") === "private"
      }
      main={
        <>
          {join.isError && join.error instanceof ApiError ? (
            <p className={roomStageAlert} role="alert">
              {join.error.message}
            </p>
          ) : null}
          {livekitSession ? (
            <LiveKitStage
              roomId={roomId}
              token={livekitSession.token}
              serverUrl={livekitSession.url}
              viewerRole={role}
            />
          ) : livekit.isError ? (
            <div className={roomStagePlaceholder} role="status">
              <WifiOff className="size-8 text-muted" aria-hidden="true" />
              <p>{t("room.livekitError")}</p>
              <Button
                variant="secondary"
                onClick={() => void queryClient.invalidateQueries({ queryKey: ["livekit", roomId] })}
              >
                {t("room.livekitRetry")}
              </Button>
            </div>
          ) : (
            <div className={cn(roomStagePlaceholder, roomStagePlaceholderMuted)} role="status">
              <Wifi className="size-6 animate-pulse" aria-hidden="true" />
              <p>{t("room.mediaConnecting")}</p>
            </div>
          )}
        </>
      }
      rail={
        side === "chat" ? (
          <ChatPanel roomId={roomId} lastEvent={lastEvent} viewerRole={role} embedded />
        ) : (
          <ParticipantsPanel
            roomId={roomId}
            lastEvent={lastEvent}
            viewerRole={role}
            embedded
            active={joined}
          />
        )
      }
    />
    </RoomCineProvider>
    </RoomDirectVideoProvider>
    </div>
  );
}
