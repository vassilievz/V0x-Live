import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  ParticipantTile,
  isTrackReference,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { cn } from "@/lib/cn";

type Props = {
  mainTrack: TrackReferenceOrPlaceholder;
  stripTracks: TrackReferenceOrPlaceholder[];
};

function requestShellFullscreen(shell: HTMLElement | null) {
  if (!shell) {
    return;
  }
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  const req =
    shell.requestFullscreen?.bind(shell) ??
    (shell as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(
      shell,
    );
  req?.();
}

export function BroadcastScreenShareStage({ mainTrack, stripTracks }: Props) {
  const { t } = useTranslation();
  const shellRef = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);

  const isScreenShare =
    isTrackReference(mainTrack) &&
    mainTrack.publication.source === Track.Source.ScreenShare;
  const screenOnly = isScreenShare && stripTracks.length === 0;

  useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    requestShellFullscreen(shellRef.current);
  }, []);

  const fsButton = isScreenShare ? (
    <button
      type="button"
      className="broadcast-stage-direct-fs broadcast-screen-share-fs"
      aria-label={fs ? t("cine.exitFullscreen") : t("cine.fullscreen")}
      onClick={toggleFullscreen}
    >
      {fs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  ) : null;

  if (screenOnly) {
    return (
      <div
        ref={shellRef}
        className={cn(
          "broadcast-screen-share-shell broadcast-stage-screen-only",
          fs && "broadcast-screen-share-shell--fs",
        )}
      >
        {fsButton}
        <ParticipantTile trackRef={mainTrack} className="broadcast-stage-focus" />
      </div>
    );
  }

  return (
    <FocusLayoutContainer className="broadcast-stage-live-layout">
      {stripTracks.length > 0 ? (
        <CarouselLayout tracks={stripTracks}>
          <ParticipantTile />
        </CarouselLayout>
      ) : null}
      <div
        ref={shellRef}
        className={cn(
          "broadcast-screen-share-shell broadcast-stage-focus-wrap",
          isScreenShare && "broadcast-screen-share-shell--hero",
          fs && "broadcast-screen-share-shell--fs",
        )}
      >
        {fsButton}
        <FocusLayout trackRef={mainTrack} className="broadcast-stage-focus" />
      </div>
    </FocusLayoutContainer>
  );
}
