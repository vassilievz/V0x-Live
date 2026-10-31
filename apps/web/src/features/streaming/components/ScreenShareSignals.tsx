import { RoomEvent, Track } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";
import { useEffect, useRef } from "react";
import { roomsApi } from "@/lib/api";

type Props = {
  roomId: string;
};

export function ScreenShareSignals({ roomId }: Props) {
  const room = useRoomContext();
  const sharing = useRef(false);

  useEffect(() => {
    if (!room) {
      return;
    }

    const onPublished = (publication: { source: Track.Source }) => {
      if (publication.source !== Track.Source.ScreenShare) {
        return;
      }
      sharing.current = true;
      void roomsApi.screenSignal(roomId, "start");
    };

    const onUnpublished = (publication: { source: Track.Source }) => {
      if (publication.source !== Track.Source.ScreenShare || !sharing.current) {
        return;
      }
      sharing.current = false;
      void roomsApi.screenSignal(roomId, "stop");
    };

    room.on(RoomEvent.TrackPublished, onPublished);
    room.on(RoomEvent.TrackUnpublished, onUnpublished);
    return () => {
      room.off(RoomEvent.TrackPublished, onPublished);
      room.off(RoomEvent.TrackUnpublished, onUnpublished);
    };
  }, [room, roomId]);

  return null;
}
