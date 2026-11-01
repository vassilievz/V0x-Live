import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MonitorUp, Radio } from "lucide-react";
import {
  LayoutContextProvider,
  RoomAudioRenderer,
  StartAudio,
  isTrackReference,
  useCreateLayoutContext,
  usePinnedTracks,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { BroadcastSettingsProvider } from "@/features/streaming/BroadcastSettingsContext";
import { BroadcastControlBar } from "@/features/streaming/components/BroadcastControlBar";
import { STAGE_IDLE_ART } from "@/features/streaming/stageIdleMedia";
import { useRoomDirectVideo } from "@/features/room-music/RoomDirectVideoContext";
import { RoomDirectVideoStage } from "@/features/room-music/components/RoomDirectVideoStage";
import { RoomYouTubeStage } from "@/features/room-music/components/RoomYouTubeStage";
import { BroadcastScreenShareStage } from "@/features/streaming/components/BroadcastScreenShareStage";
import { useRoomCine } from "@/features/room-cine/RoomCineContext";
import { RoomCineStage } from "@/features/room-cine/components/RoomCineStage";
import { cineStageReady } from "@/features/room-cine/cineStageReady";

function isLiveTrackRef(ref: TrackReferenceOrPlaceholder | undefined): boolean {
  return !!ref && mediaTrackIsRenderable(ref);
}

function sameTrackRef(
  a: TrackReferenceOrPlaceholder | undefined,
  b: TrackReferenceOrPlaceholder | undefined,
): boolean {
  if (!a || !b || !isTrackReference(a) || !isTrackReference(b)) {
    return false;
  }
  return (
    a.publication.trackSid === b.publication.trackSid &&
    a.participant.identity === b.participant.identity
  );
}

function mediaTrackIsRenderable(ref: TrackReferenceOrPlaceholder): boolean {
  if (!isTrackReference(ref) || !ref.publication.track) {
    return false;
  }
  const media = ref.publication.track.mediaStreamTrack;
  if (media?.readyState === "ended") {
    return false;
  }
  return true;
}

function screenShareScore(ref: TrackReferenceOrPlaceholder): number {
  if (!isTrackReference(ref) || !ref.publication.track) {
    return -1;
  }
  let score = 0;
  if (ref.publication.isSubscribed) {
    score += 1_000;
  }
  if (ref.participant.isLocal) {
    score += 500;
  }
  const media = ref.publication.track.mediaStreamTrack;
  const settings = media?.getSettings();
  if (settings?.width && settings?.height) {
    score += settings.width * settings.height;
  }
  if (media?.readyState === "live") {
    score += 250;
  }
  return score;
}

function pickHeroTrack(
  tracks: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder | undefined {
  const live = tracks.filter(isTrackReference).filter(mediaTrackIsRenderable);
  const screens = live.filter((t) => t.publication.source === Track.Source.ScreenShare);
  if (screens.length > 0) {
    return screens.reduce((best, t) => (screenShareScore(t) > screenShareScore(best) ? t : best));
  }
  return live.find((t) => t.publication.source === Track.Source.Camera);
}

function pickBestScreenShare(
  tracks: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder | undefined {
  const screens = tracks
    .filter(isTrackReference)
    .filter((t) => t.publication.source === Track.Source.ScreenShare && t.publication.track);
  if (screens.length === 0) {
    return undefined;
  }
  return screens.reduce((best, t) => (screenShareScore(t) > screenShareScore(best) ? t : best));
}

export function BroadcastStage({ roomId, viewerRole }: { roomId?: string; viewerRole?: string | null }) {
  const { t } = useTranslation();
  const directVideo = useRoomDirectVideo();
  const roomCine = useRoomCine();
  const layoutContext = useCreateLayoutContext();
  const lastScreenShare = useRef<TrackReferenceOrPlaceholder | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const heroTrack = useMemo(() => pickHeroTrack(tracks), [tracks]);
  const pinned = usePinnedTracks(layoutContext)[0];
  const pinnedLive =
    pinned && isLiveTrackRef(pinned) && isTrackReference(pinned) ? pinned : undefined;
  const mainTrack = pinnedLive ?? heroTrack;
  const musicActive = Boolean(directVideo?.state?.active);
  const showMusicStage = musicActive;
  const showCine =
    cineStageReady(roomCine?.state) && !musicActive;

  const stripTracks = tracks.filter(
    (t) => !mainTrack || !sameTrackRef(t, mainTrack),
  );

  const carouselTracks = useMemo(() => {
    const mainIsScreen =
      mainTrack &&
      isTrackReference(mainTrack) &&
      mainTrack.publication.source === Track.Source.ScreenShare;
    return stripTracks.filter((t) => {
      if (!isTrackReference(t) || !t.publication.track) {
        return false;
      }
      if (mainIsScreen && t.publication.source === Track.Source.ScreenShare) {
        return false;
      }
      return true;
    });
  }, [stripTracks, mainTrack]);

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((t) => t.publication.source === Track.Source.ScreenShare && t.publication.track);

  useEffect(() => {
    const best = pickBestScreenShare(screenShareTracks);
    if (!best || !isTrackReference(best)) {
      if (lastScreenShare.current) {
        layoutContext.pin.dispatch?.({ msg: "clear_pin" });
        lastScreenShare.current = null;
      }
      return;
    }

    if (!sameTrackRef(lastScreenShare.current ?? undefined, best)) {
      layoutContext.pin.dispatch?.({
        msg: "set_pin",
        trackReference: best,
      });
      lastScreenShare.current = best;
    }
  }, [layoutContext.pin, screenShareTracks]);

  return (
    <BroadcastSettingsProvider>
      <LayoutContextProvider value={layoutContext}>
        <div className="broadcast-stage" data-vox-stage={showMusicStage ? "music" : showCine ? "cine" : "livekit"}>
          <div className="broadcast-stage-viewport">
              {showMusicStage ? (
                directVideo?.isDirectActive ? (
                  <RoomDirectVideoStage />
                ) : (
                  <RoomYouTubeStage />
                )
              ) : showCine ? (
                <RoomCineStage />
              ) : mainTrack && isTrackReference(mainTrack) ? (
                <BroadcastScreenShareStage mainTrack={mainTrack} stripTracks={carouselTracks} />
              ) : (
                <div className="broadcast-stage-idle" role="status">
                  <div className="broadcast-stage-idle-media" aria-hidden="true">
                    <img
                      src={STAGE_IDLE_ART}
                      alt=""
                      className="broadcast-stage-idle-art"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                    <div className="broadcast-stage-idle-veil" />
                  </div>
                  <div className="broadcast-stage-idle-content">
                  <div className="broadcast-stage-idle-ring" aria-hidden="true">
                    <Radio className="broadcast-stage-idle-icon" />
                  </div>
                  <p className="broadcast-stage-idle-title">{t("broadcast.stageIdleTitle")}</p>
                  <p className="broadcast-stage-idle-copy">{t("broadcast.stageIdleCopy")}</p>
                  <ul className="broadcast-stage-idle-steps">
                    <li>{t("broadcast.idleStepMic")}</li>
                    <li>{t("broadcast.idleStepCam")}</li>
                    <li>{t("broadcast.idleStepScreen")}</li>
                  </ul>
                  <p className="broadcast-stage-idle-hint">
                    <MonitorUp size={16} aria-hidden="true" />
                    {t("broadcast.stageIdleHint")}
                  </p>
                  </div>
                </div>
              )}
          </div>

          <BroadcastControlBar roomId={roomId} viewerRole={viewerRole} />
          <StartAudio label={t("broadcast.startAudioLabel")} />
          <RoomAudioRenderer />
        </div>
      </LayoutContextProvider>
    </BroadcastSettingsProvider>
  );
}
