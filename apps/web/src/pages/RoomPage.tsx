import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff } from "lucide-react";
import { Button } from "@v0xlive/ui";
import { ApiError, roomsApi } from "@/lib/api";
import type { JoinRoomResponse, LiveKitTokenResponse } from "@v0xlive/api-client";
import { cn } from "@/lib/cn";
import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { LiveKitStage } from "@/features/streaming/components/LiveKitStage";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { RoomAccessGate } from "@/features/rooms/components/RoomAccessGate";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import {
  ParticipantsPanel,
} from "@/features/participants/components/ParticipantsPanel";
import { RoomStageShell } from "@/features/rooms/components/RoomStageShell";
import {
  actionLink,
  actionLinkPill,
  fieldHelp,
  homeBentoPanel,
  homeCellCode,
  homeSectionTitle,
  roomStageAlert,
  roomStagePlaceholder,
  roomStagePlaceholderMuted,
  sitePanel,
  sitePanelCompact,
} from "@/ui";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [side, setSide] = useState<"chat" | "people">("chat");
  const [mobilePanel, setMobilePanel] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const autoJoinDone = useRef(false);

  const preview = useQuery({
    queryKey: ["room-preview", roomId],
    queryFn: () => roomsApi.preview(roomId!),
    enabled: !!roomId,
  });

  const session = useSessionUser();
  const { ensuring } = useEnsureGuestSession();

  const hasSession = session.isSuccess;

  const applyJoinSuccess = (data: JoinRoomResponse) => {
    setRole(data.role);
    setJoined(true);
    if (data.livekit && roomId) {
      queryClient.setQueryData<LiveKitTokenResponse>(["livekit", roomId], data.livekit);
    }
  };

  const join = useMutation({
    mutationFn: (password?: string) => roomsApi.join(roomId!, password),
    onSuccess: (data) => {
      applyJoinSuccess(data);
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  useEffect(() => {
    if (!roomId || joined || join.isPending || autoJoinDone.current) {
      return;
    }
    if (!session.isSuccess || !preview.data || preview.data.password_required) {
      return;
    }
    autoJoinDone.current = true;
    join.mutate(undefined);
  }, [roomId, joined, session.isSuccess, preview.data, join]);

  const livekit = useQuery({
    queryKey: ["livekit", roomId],
    queryFn: () => roomsApi.livekitToken(roomId!),
    enabled: !!roomId && joined,
    retry: 2,
  });

  const { connected, lastEvent } = useRoomSocket(roomId, joined || join.isPending);

  const leave = useMutation({
    mutationFn: () => roomsApi.leave(roomId!),
    onSuccess: () => navigate("/dashboard"),
  });

  const closeRoom = useMutation({
    mutationFn: () => roomsApi.close(roomId!),
    onSuccess: () => navigate("/dashboard"),
  });

  useEffect(() => {
    document.title = `${t("meta.siteTitle")} | ${preview.data?.name ?? t("room.liveTitle")}`;
  }, [preview.data?.name, t, i18n.language]);

  if (!roomId) {
    return null;
  }

  const roomName = preview.data?.name ?? t("room.defaultName");
  const waitingSession = session.isLoading || ensuring || preview.isLoading;
  const showGate =
    !joined &&
    !join.isPending &&
    !waitingSession &&
    (!hasSession || preview.data?.password_required === true);

  const showStage = joined || join.isPending || join.isError;

  if (waitingSession && !joined) {
    return (
      <SiteCatalogShell>
        <section className={cn(homeBentoPanel, sitePanelCompact)}>
          <p className={fieldHelp} role="status">
            {t("room.loading")}
          </p>
        </section>
      </SiteCatalogShell>
    );
  }

  if (preview.isError) {
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
        passwordRequired={preview.data?.password_required ?? false}
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
      <SiteCatalogShell>
        <section className={cn(homeBentoPanel, sitePanelCompact)}>
          <p className={fieldHelp} role="status">
            {join.isPending ? t("room.joining") : t("room.loading")}
          </p>
        </section>
      </SiteCatalogShell>
    );
  }

  const livekitSession =
    livekit.data ??
    queryClient.getQueryData<LiveKitTokenResponse>(["livekit", roomId]);

  return (
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
          />
        )
      }
    />
  );
}
