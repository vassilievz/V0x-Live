import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import "@livekit/components-styles/prefabs";
import "@livekit/components-styles/components/layout";
import "@/styles/livekit-overrides.css";
import { getLiveKitUrl } from "@/lib/api";
import { cn } from "@/lib/cn";
import { roomStageBroadcast } from "@/ui";
import { BroadcastStage } from "@/features/streaming/components/BroadcastStage";
import { ScreenShareSignals } from "@/features/streaming/components/ScreenShareSignals";

type Props = {
  token: string;
  serverUrl?: string;
  roomId?: string;
  onDisconnected?: () => void;
};

export function LiveKitStage({ token, serverUrl, roomId, onDisconnected }: Props) {
  const url = serverUrl || getLiveKitUrl();

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect
      audio={false}
      video={false}
      data-lk-theme="default"
      onDisconnected={onDisconnected}
      className={cn("broadcast-room lk-room-container", roomStageBroadcast)}
    >
      <BroadcastStage />
      {roomId ? <ScreenShareSignals roomId={roomId} /> : null}
    </LiveKitRoom>
  );
}
