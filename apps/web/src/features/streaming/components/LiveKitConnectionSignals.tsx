import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

/**
 * Subscribes to LiveKit connection lifecycle events and cleans up on unmount.
 * Keeps media subscriptions alive across short network blips without a full page reload.
 */
export function LiveKitConnectionSignals() {
  const room = useRoomContext();

  useEffect(() => {
    const onReconnecting = () => {
      console.info("[livekit] reconnecting");
    };
    const onReconnected = () => {
      console.info("[livekit] reconnected");
    };
    const onMediaDevicesError = (error: Error) => {
      console.warn("[livekit] media device error", error.message);
    };

    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  return null;
}
