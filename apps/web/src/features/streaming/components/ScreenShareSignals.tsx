import { RoomEvent, Track } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";
import { useEffect, useRef } from "react";
import { roomsApi } from "@/lib/api";

type Props = {
  roomId: string;
};

const BROADCAST_SOURCES = new Set<Track.Source>([
  Track.Source.ScreenShare,
  Track.Source.Camera,
]);

function isBroadcastSource(source: Track.Source): boolean {
  return BROADCAST_SOURCES.has(source);
}

export function ScreenShareSignals({ roomId }: Props) {
  const room = useRoomContext();
  const activeSources = useRef(new Set<Track.Source>());
  const broadcastOn = useRef(false);

  useEffect(() => {
    if (!room) {
      return;
    }

    const syncBroadcast = () => {
      const next = activeSources.current.size > 0;
      if (next === broadcastOn.current) {
        return;
      }
      broadcastOn.current = next;
      void roomsApi.screenSignal(roomId, next ? "start" : "stop");
    };

    const seedFromRoom = () => {
      activeSources.current.clear();
      for (const pub of room.localParticipant.trackPublications.values()) {
        if (pub.track && isBroadcastSource(pub.source)) {
          activeSources.current.add(pub.source);
        }
      }
      syncBroadcast();
    };

    seedFromRoom();

    const onPublished = (publication: { source: Track.Source }) => {
      if (!isBroadcastSource(publication.source)) {
        return;
      }
      activeSources.current.add(publication.source);
      syncBroadcast();
    };

    const onUnpublished = (publication: { source: Track.Source }) => {
      if (!isBroadcastSource(publication.source)) {
        return;
      }
      activeSources.current.delete(publication.source);
      syncBroadcast();
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
