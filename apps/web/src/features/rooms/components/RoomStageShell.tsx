import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageSquare, Users } from "lucide-react";
import { Button } from "@v0xlive/ui";
import { SidePanelTab } from "@/features/participants/components/ParticipantsPanel";

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
    <div className="room-stage-shell">
      <header className="room-stage-header">
        <div className="room-stage-header-brand">
          <Link
            to="/dashboard"
            className="room-stage-back"
            aria-label={t("room.backToSpace")}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="room-stage-header-copy">
            <span className="home-cell-code room-stage-code">{t("room.headerCode")}</span>
            <h1 className="room-stage-title">{roomName}</h1>
            <p
              className={`room-stage-status${connected ? " room-stage-status--live" : ""}`}
              role="status"
            >
              <span className="room-stage-status-dot" aria-hidden="true" />
              {connected ? t("room.realtime") : t("room.reconnecting")}
            </p>
          </div>
        </div>

        <div className="room-stage-header-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="room-stage-rail-toggle lg:hidden"
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
              className="room-stage-action-btn"
              onClick={onCloseRoom}
              disabled={closeRoomPending}
            >
              {t("room.closeRoom")}
            </Button>
          ) : null}
          <Button
            variant="danger"
            size="sm"
            className="room-stage-action-btn"
            onClick={onLeave}
            disabled={leavePending}
          >
            {t("room.leave")}
          </Button>
        </div>
      </header>

      <div className="room-stage-body">
        <div className="room-stage-workspace">
          <div className="room-stage-main">
            <div className="room-stage-main-fill">{main}</div>
          </div>
          <aside
            id="room-stage-rail"
            className={`room-stage-rail${mobileRailOpen ? " room-stage-rail--open" : ""}`}
            aria-label={t("room.sidebarAria")}
          >
            <div className="room-stage-rail-handle lg:hidden" aria-hidden="true" />
            <div className="room-stage-rail-tabs" role="tablist">
              <SidePanelTab active={side === "chat"} onClick={() => onSideChange("chat")}>
                <MessageSquare className="size-4" aria-hidden="true" />
                {t("room.chatTab")}
              </SidePanelTab>
              <SidePanelTab active={side === "people"} onClick={() => onSideChange("people")}>
                <Users className="size-4" aria-hidden="true" />
                {t("room.peopleTab")}
              </SidePanelTab>
            </div>
            <div className="room-stage-rail-panel">{rail}</div>
          </aside>
        </div>

        {mobileRailOpen ? (
          <button
            type="button"
            className="room-stage-backdrop lg:hidden"
            aria-label={t("room.closePanel")}
            onClick={onMobileRailClose}
          />
        ) : null}
      </div>
    </div>
  );
}
