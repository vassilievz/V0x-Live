import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquare, Users } from "lucide-react";
import { Button } from "@v0xlive/ui";
import { SidePanelTab } from "@/features/participants/components/ParticipantsPanel";
import { cn } from "@/lib/cn";
import {
  homeCellCode,
  roomStageActionBtn,
  roomStageBack,
  roomStageBackdrop,
  roomStageBody,
  roomStageCode,
  roomStageHeader,
  roomStageHeaderActions,
  roomStageHeaderBrand,
  roomStageHeaderCopy,
  roomStageMain,
  roomStageMainFill,
  roomStageRail,
  roomStageRailHandle,
  roomStageRailPanel,
  roomStageRailTabs,
  roomStageRailToggle,
  roomStageShell,
  roomStageStatus,
  roomStageStatusDot,
  roomStageStatusLive,
  roomStageTitle,
  roomStageWorkspace,
} from "@/ui";

type Side = "chat" | "people";

type Props = {
  roomName: string;
  connected: boolean;
  side: Side;
  onSideChange: (side: Side) => void;
  mobileRailOpen: boolean;
  onMobileRailToggle: () => void;
  onMobileRailClose: () => void;
  role: string | null;
  onLeave: () => void;
  leavePending: boolean;
  onCloseRoom?: () => void;
  closeRoomPending?: boolean;
  main: ReactNode;
  rail: ReactNode;
};

export function RoomStageShell({
  roomName,
  connected,
  side,
  onSideChange,
  mobileRailOpen,
  onMobileRailToggle,
  onMobileRailClose,
  role,
  onLeave,
  leavePending,
  onCloseRoom,
  closeRoomPending,
  main,
  rail,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={roomStageShell}>
      <header className={roomStageHeader}>
        <div className={roomStageHeaderBrand}>
          <Link
            to="/dashboard"
            className={roomStageBack}
            aria-label={t("room.backToSpace")}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className={roomStageHeaderCopy}>
            <span className={cn(homeCellCode, roomStageCode)}>{t("room.headerCode")}</span>
            <h1 className={roomStageTitle}>{roomName}</h1>
            <p
              className={cn(roomStageStatus, connected && roomStageStatusLive)}
              role="status"
            >
              <span className={roomStageStatusDot} aria-hidden="true" />
              {connected ? t("room.realtime") : t("room.reconnecting")}
            </p>
          </div>
        </div>

        <div className={roomStageHeaderActions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={roomStageRailToggle}
            aria-expanded={mobileRailOpen}
            aria-controls="room-stage-rail"
            onClick={onMobileRailToggle}
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            {t("room.openPanelShort")}
          </Button>

          {role === "host" && onCloseRoom ? (
            <Button
              variant="secondary"
              size="sm"
              className={roomStageActionBtn}
              onClick={onCloseRoom}
              disabled={closeRoomPending}
            >
              {t("room.closeRoom")}
            </Button>
          ) : null}
          <Button
            variant="danger"
            size="sm"
            className={roomStageActionBtn}
            onClick={onLeave}
            disabled={leavePending}
          >
            {t("room.leave")}
          </Button>
        </div>
      </header>

      <div className={roomStageBody}>
        <div className={roomStageWorkspace}>
          <div className={roomStageMain}>
            <div className={roomStageMainFill}>{main}</div>
          </div>
          <aside
            id="room-stage-rail"
            className={roomStageRail(mobileRailOpen)}
            aria-label={t("room.sidebarAria")}
          >
            <div className={roomStageRailHandle} aria-hidden="true" />
            <div className={roomStageRailTabs} role="tablist">
              <SidePanelTab active={side === "chat"} onClick={() => onSideChange("chat")}>
                <MessageSquare className="size-4" aria-hidden="true" />
                {t("room.chatTab")}
              </SidePanelTab>
              <SidePanelTab active={side === "people"} onClick={() => onSideChange("people")}>
                <Users className="size-4" aria-hidden="true" />
                {t("room.peopleTab")}
              </SidePanelTab>
            </div>
            <div className={roomStageRailPanel}>{rail}</div>
          </aside>
        </div>

        {mobileRailOpen ? (
          <button
            type="button"
            className={roomStageBackdrop}
            aria-label={t("room.closePanel")}
            onClick={onMobileRailClose}
          />
        ) : null}
      </div>
    </div>
  );
}
