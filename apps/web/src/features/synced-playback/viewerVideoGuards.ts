import { expectedPositionSec } from "@/features/room-music/sync";

export type ViewerSyncSnapshot = {
  playing?: boolean;
  position_sec?: number;
  state_at?: string;
};

const MEDIA_KEYS = new Set([" ", "Spacebar", "k", "K", "ArrowLeft", "ArrowRight"]);

export function attachViewerVideoGuards(
  video: HTMLVideoElement,
  opts: {
    canControl: boolean;
    getSnapshot: () => ViewerSyncSnapshot | undefined;
    applyingRemote: { current: boolean };
    suppressEvents: { current: boolean };
  },
): () => void {
  const onPlay = () => {
    if (opts.suppressEvents.current || opts.applyingRemote.current || opts.canControl) {
      return;
    }
    const snap = opts.getSnapshot();
    if (snap?.playing === false) {
      video.pause();
    }
  };

  const onPause = () => {
    if (opts.suppressEvents.current || opts.applyingRemote.current || opts.canControl) {
      return;
    }
    const snap = opts.getSnapshot();
    if (snap?.playing !== false) {
      void video.play().catch(() => {
        /* autoplay policy */
      });
    }
  };

  const onSeeking = () => {
    if (opts.suppressEvents.current || opts.applyingRemote.current || opts.canControl) {
      return;
    }
    const snap = opts.getSnapshot();
    if (!snap) {
      return;
    }
    const expected = expectedPositionSec(snap);
    if (Math.abs(video.currentTime - expected) > 0.35) {
      video.currentTime = expected;
    }
  };

  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("seeking", onSeeking);

  return () => {
    video.removeEventListener("play", onPlay);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("seeking", onSeeking);
  };
}

export function blockViewerMediaKeys(
  target: HTMLElement,
  enabled: boolean,
): () => void {
  if (!enabled) {
    return () => {};
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!MEDIA_KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  target.addEventListener("keydown", onKeyDown, true);
  return () => target.removeEventListener("keydown", onKeyDown, true);
}
