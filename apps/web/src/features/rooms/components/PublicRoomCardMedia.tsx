import { Monitor, Radio } from "lucide-react";
import { useTranslation } from "react-i18next";
import { publicRoomCoverPath, type RoomSummary } from "@v0xlive/api-client";
import { cn } from "@/lib/cn";
import {
  roomCardExploreMedia,
  roomCardExploreMediaBadge,
  roomCardExploreMediaIdle,
  roomCardExploreMediaImg,
  signalDot,
} from "@/ui";

type Props = {
  room: RoomSummary;
};

export function PublicRoomCardMedia({ room }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={roomCardExploreMedia}
      data-live={room.is_live ? "true" : "false"}
      data-preview={room.has_preview ? "true" : "false"}
    >
      {room.is_live ? (
        <span className={roomCardExploreMediaBadge}>
          <span className={signalDot} aria-hidden="true" />
          {t("explore.live")}
        </span>
      ) : null}

      {room.has_preview ? (
        <img
          src={publicRoomCoverPath(room.id)}
          alt=""
          className={roomCardExploreMediaImg}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <div className={cn(roomCardExploreMediaIdle)} aria-hidden="true">
          {room.is_live ? (
            <Radio strokeWidth={1.5} />
          ) : (
            <Monitor strokeWidth={1.5} />
          )}
        </div>
      )}
    </div>
  );
}
