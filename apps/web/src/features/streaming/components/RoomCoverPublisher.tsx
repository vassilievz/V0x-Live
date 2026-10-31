import { useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { useLocalParticipant, useTracks } from "@livekit/components-react";
import { roomsApi } from "@/lib/api";

const CAPTURE_INTERVAL_MS = 12_000;
const MAX_WIDTH = 640;

type Props = {
  roomId: string;
};

async function captureTrackFrame(track: Track): Promise<string | null> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  track.attach(video);
  try {
    await video.play().catch(() => undefined);
    await new Promise((resolve) => {
      if (video.readyState >= 2) {
        resolve(undefined);
        return;
      }
      video.addEventListener("loadeddata", () => resolve(undefined), { once: true });
    });
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      return null;
    }
    const scale = Math.min(1, MAX_WIDTH / w);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.68);
  } finally {
    track.detach(video);
    video.remove();
  }
}

export function RoomCoverPublisher({ roomId }: Props) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks(
    [Track.Source.ScreenShare, Track.Source.Camera],
    { onlySubscribed: false },
  );
  const uploading = useRef(false);

  useEffect(() => {
    const localTrack = tracks.find(
      (ref) => ref.participant.identity === localParticipant.identity && ref.publication?.track,
    )?.publication?.track;

    if (!localTrack) {
      return;
    }

    let cancelled = false;

    const upload = async () => {
      if (uploading.current || cancelled) {
        return;
      }
      uploading.current = true;
      try {
        const dataUrl = await captureTrackFrame(localTrack);
        if (!dataUrl || cancelled) {
          return;
        }
        await roomsApi.uploadCover(roomId, dataUrl);
      } catch {
        /* best-effort preview */
      } finally {
        uploading.current = false;
      }
    };

    void upload();
    const timer = window.setInterval(() => {
      void upload();
    }, CAPTURE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [localParticipant.identity, roomId, tracks]);

  return null;
}
