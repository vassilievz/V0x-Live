import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import "@livekit/components-styles/prefabs";
import "@livekit/components-styles/components/layout";
import "@/styles/livekit-overrides.css";
import { getLiveKitUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { roomStageBroadcast } from "@/ui";
import { BroadcastStage } from "@/features/streaming/components/BroadcastStage";
import { RoomCoverPublisher } from "@/features/streaming/components/RoomCoverPublisher";
import { ScreenShareSignals } from "@/features/streaming/components/ScreenShareSignals";
import { LiveKitConnectionSignals } from "@/features/streaming/components/LiveKitConnectionSignals";
import { LiveKitParticipantMediaBridge } from "@/features/streaming/components/LiveKitParticipantMediaBridge";
import { LIVEKIT_ROOM_OPTIONS } from "@/features/streaming/livekitRoomConfig";
import { RoomAudioPlaybackUnlock } from "@/features/streaming/components/RoomAudioPlaybackUnlock";

type Props = {
  token: string;
  serverUrl?: string;
  roomId?: string;
  viewerRole?: string | null;
  onDisconnected?: () => void;
};

export function LiveKitStage({ token, serverUrl, roomId, viewerRole, onDisconnected }: Props) {
  const url = serverUrl || getLiveKitUrl();

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect
      audio={false}
      video={false}
      options={LIVEKIT_ROOM_OPTIONS}
      data-lk-theme="default"
      onDisconnected={onDisconnected}
      className={cn("broadcast-room lk-room-container", roomStageBroadcast)}
    >
      <LiveKitConnectionSignals />
      <LiveKitParticipantMediaBridge />
      <RoomAudioRenderer />
      <RoomAudioPlaybackUnlock />
      <BroadcastStage roomId={roomId} viewerRole={viewerRole} />
      {roomId ? (
        <>
          <ScreenShareSignals roomId={roomId} />
          <RoomCoverPublisher roomId={roomId} />
        </>
      ) : null}
    </LiveKitRoom>
  );
}
