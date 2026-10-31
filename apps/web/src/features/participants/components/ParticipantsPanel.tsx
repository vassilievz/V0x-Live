import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Mic, MicOff, UserMinus, Video, VideoOff } from "lucide-react";
import type { RealtimeEvent } from "@v0xlive/api-client";
import { Button } from "@v0xlive/ui";
import { UserAvatar } from "@/components/user/UserAvatar";
import { roomsApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { participantRoleKey } from "@/i18n/participantRole";
import {
  roomPanel,
  roomPanelEmbedded,
  roomPanelHeading,
  roomParticipantActions,
  roomParticipantAvatar,
  roomParticipantEmpty,
  roomParticipantHead,
  roomParticipantIconBtn,
  roomParticipantList,
  roomParticipantMain,
  roomParticipantMedia,
  roomParticipantName,
  roomParticipantRole,
  roomParticipantRoleHost,
  roomParticipantRow,
  roomStageTab,
  roomStageTabActive,
} from "@/ui";

type Props = {
  roomId: string;
  lastEvent: RealtimeEvent | null;
  viewerRole: string | null;
  embedded?: boolean;
};

export function ParticipantsPanel({ roomId, lastEvent, viewerRole, embedded }: Props) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const list = useQuery({
    queryKey: ["participants", roomId],
    queryFn: () => roomsApi.participants(roomId),
    refetchInterval: lastEvent?.type?.startsWith("room.participant") ? 2000 : 8000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["participants", roomId] });
  };

  const patch = useMutation({
    mutationFn: (args: {
      id: string;
      body: { can_publish?: boolean; muted?: boolean };
    }) => roomsApi.patchParticipant(roomId, args.id, args.body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (participantId: string) =>
      roomsApi.removeParticipant(roomId, participantId),
    onSuccess: invalidate,
  });

  const isHost = viewerRole === "host";
  const canRemove = viewerRole === "host" || viewerRole === "moderator";
  const count = list.data?.items.length ?? 0;

  return (
    <div className={cn(roomPanel, embedded && roomPanelEmbedded)}>
      {!embedded ? (
        <p className={roomPanelHeading}>{t("participants.title")}</p>
      ) : null}
      <ul className={roomParticipantList} aria-label={t("participants.title")}>
        {list.data?.items.map((p) => (
          <li key={p.id} className={roomParticipantRow}>
            <UserAvatar name={p.display_name} size="sm" className={roomParticipantAvatar} />
            <div className={cn(roomParticipantMain, "min-w-0")}>
              <div className={roomParticipantHead}>
                <p className={roomParticipantName}>{p.display_name}</p>
                <span
                  className={cn(
                    roomParticipantRole,
                    p.role === "host" && roomParticipantRoleHost,
                  )}
                >
                  {t(`participants.roles.${participantRoleKey(p.role)}`)}
                </span>
              </div>
              <div className={roomParticipantMedia} aria-label={t("participants.mediaStatus")}>
                {p.muted ? (
                  <MicOff className="size-3.5 text-danger" aria-label={t("participants.muted")} />
                ) : (
                  <Mic className="size-3.5" aria-label={t("participants.micOn")} />
                )}
                {p.can_publish ? (
                  <Video className="size-3.5" aria-label={t("participants.canPublish")} />
                ) : (
                  <VideoOff className="size-3.5 text-muted" aria-hidden="true" />
                )}
              </div>
            </div>
            {p.role !== "host" && (canRemove || isHost) ? (
              <div className={roomParticipantActions}>
                {canRemove ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className={roomParticipantIconBtn}
                    aria-label={t("participants.removeAria", { name: p.display_name })}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(p.id)}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                ) : null}
                {isHost ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={roomParticipantIconBtn}
                      aria-label={p.muted ? t("participants.unmute") : t("participants.mute")}
                      disabled={patch.isPending}
                      onClick={() =>
                        patch.mutate({ id: p.id, body: { muted: !p.muted } })
                      }
                    >
                      {p.muted ? (
                        <MicOff className="size-4" />
                      ) : (
                        <Mic className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={roomParticipantIconBtn}
                      aria-label={
                        p.can_publish
                          ? t("participants.blockVideo")
                          : t("participants.allowVideo")
                      }
                      disabled={patch.isPending}
                      onClick={() =>
                        patch.mutate({
                          id: p.id,
                          body: { can_publish: !p.can_publish },
                        })
                      }
                    >
                      {p.can_publish ? (
                        <Video className="size-4" />
                      ) : (
                        <VideoOff className="size-4" />
                      )}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
        {list.isLoading ? (
          <li className={roomParticipantEmpty}>{t("participants.loading")}</li>
        ) : null}
        {list.isSuccess && count === 0 ? (
          <li className={roomParticipantEmpty}>{t("participants.empty")}</li>
        ) : null}
      </ul>
    </div>
  );
}

export function SidePanelTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(roomStageTab, active && roomStageTabActive)}
    >
      {children}
    </button>
  );
}
