import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

function resumeRemoteMediaElements(root: ParentNode) {
  root.querySelectorAll("audio,video").forEach((node) => {
    if (!(node instanceof HTMLMediaElement)) {
      return;
    }
    node.muted = false;
    void node.play().catch(() => undefined);
  });
}

/** Visible unlock when the browser blocks WebRTC audio (mic + screen-share tab audio). */
export function RoomAudioPlaybackUnlock() {
  const { t } = useTranslation();
  const room = useRoomContext();
  const [blocked, setBlocked] = useState(() => !room.canPlaybackAudio);

  useEffect(() => {
    const sync = () => setBlocked(!room.canPlaybackAudio);
    sync();
    room.on(RoomEvent.AudioPlaybackStatusChanged, sync);
    return () => {
      room.off(RoomEvent.AudioPlaybackStatusChanged, sync);
    };
  }, [room]);

  const unlock = useCallback(async () => {
    await room.startAudio();
    resumeRemoteMediaElements(document);
  }, [room]);

  if (!blocked) {
    return null;
  }

  return (
    <div className="room-audio-playback-unlock" role="status">
      <button type="button" className="room-audio-playback-unlock-btn" onClick={() => void unlock()}>
        <Volume2 className="size-4 shrink-0" aria-hidden="true" />
        {t("broadcast.startAudioLabel")}
      </button>
    </div>
  );
}
