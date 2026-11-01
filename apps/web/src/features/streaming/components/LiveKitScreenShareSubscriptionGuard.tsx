import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  ParticipantEvent,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type Room,
} from "livekit-client";

function isRemoteScreenShareVideo(publication: RemoteTrackPublication): boolean {
  return (
    publication.source === Track.Source.ScreenShare &&
    publication.kind === Track.Kind.Video
  );
}

function pinRemoteScreenShareVideo(participant: RemoteParticipant) {
  for (const publication of participant.trackPublications.values()) {
    if (!isRemoteScreenShareVideo(publication)) {
      continue;
    }
    if (!publication.isSubscribed) {
      publication.setSubscribed(true);
    }
    if (!publication.isEnabled) {
      publication.setEnabled(true);
    }
  }
}

function pinAllRemoteScreenShareVideos(room: Room) {
  for (const participant of room.remoteParticipants.values()) {
    pinRemoteScreenShareVideo(participant);
  }
}

/** Keeps remote screen-share video subscribed when tab-audio publications appear. */
export function LiveKitScreenShareSubscriptionGuard() {
  const room = useRoomContext();

  useEffect(() => {
    const subs: Array<() => void> = [];

    const attachParticipant = (participant: RemoteParticipant) => {
      pinRemoteScreenShareVideo(participant);
      const onChange = () => pinRemoteScreenShareVideo(participant);
      participant.on(ParticipantEvent.TrackPublished, onChange);
      participant.on(ParticipantEvent.TrackSubscribed, onChange);
      subs.push(() => {
        participant.off(ParticipantEvent.TrackPublished, onChange);
        participant.off(ParticipantEvent.TrackSubscribed, onChange);
      });
    };

    for (const participant of room.remoteParticipants.values()) {
      attachParticipant(participant);
    }

    const onParticipantConnected = (participant: RemoteParticipant) => {
      attachParticipant(participant);
    };
    const onReconnect = () => pinAllRemoteScreenShareVideos(room);

    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.Reconnected, onReconnect);
    room.on(RoomEvent.Connected, onReconnect);

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.Reconnected, onReconnect);
      room.off(RoomEvent.Connected, onReconnect);
      for (const off of subs) {
        off();
      }
    };
  }, [room]);

  return null;
}
