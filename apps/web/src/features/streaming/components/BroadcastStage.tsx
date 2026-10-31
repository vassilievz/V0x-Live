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
  return !!ref && isTrackReference(ref) && ref.publication.track != null;
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

function pickHeroTrack(
  tracks: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder | undefined {
  const live = tracks
    .filter(isTrackReference)
    .filter((t) => t.publication.track != null);
  const screen = live.find((t) => t.publication.source === Track.Source.ScreenShare);
  if (screen) return screen;
  return live.find((t) => t.publication.source === Track.Source.Camera);
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

  const screenShareTracks = tracks
    .filter(isTrackReference)
    .filter((t) => t.publication.source === Track.Source.ScreenShare && t.publication.track);

  useEffect(() => {
    if (
      screenShareTracks.length > 0 &&
      lastScreenShare.current === null &&
      isTrackReference(screenShareTracks[0])
    ) {
      layoutContext.pin.dispatch?.({
        msg: "set_pin",
        trackReference: screenShareTracks[0],
      });
      lastScreenShare.current = screenShareTracks[0];
      return;
    }

    if (
      lastScreenShare.current &&
      !screenShareTracks.some(
        (t) =>
          isTrackReference(t) &&
          t.publication.trackSid ===
            (lastScreenShare.current && isTrackReference(lastScreenShare.current)
              ? lastScreenShare.current.publication.trackSid
              : undefined),
      )
    ) {
      layoutContext.pin.dispatch?.({ msg: "clear_pin" });
      lastScreenShare.current = null;
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
                <BroadcastScreenShareStage mainTrack={mainTrack} stripTracks={stripTracks} />
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
