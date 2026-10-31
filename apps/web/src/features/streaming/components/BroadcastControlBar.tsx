import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import {
  TrackToggle,
  useLocalParticipant,
  useLocalParticipantPermissions,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  buildCameraMediaOptions,
  buildScreenShareMediaOptions,
} from "@/features/streaming/broadcastSettings";
import { useBroadcastSettings } from "@/features/streaming/BroadcastSettingsContext";
import { BroadcastSettingsMenu } from "@/features/streaming/components/BroadcastSettingsMenu";
import { BroadcastRoomMediaButton } from "@/features/streaming/components/BroadcastRoomMediaButton";
import { BroadcastRoomCineButton } from "@/features/room-cine/components/BroadcastRoomCineButton";

type BroadcastControlBarProps = {
  roomId?: string;
  viewerRole?: string | null;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
};

function browserSupportsScreenSharing(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.mediaDevices != null &&
    "getDisplayMedia" in navigator.mediaDevices
  );
}

function useCompactBroadcastControls(): boolean {
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(max-width: 720px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return compact;
}

export function BroadcastControlBar({ roomId, viewerRole, onDeviceError }: BroadcastControlBarProps) {
  const { t } = useTranslation();
  const compact = useCompactBroadcastControls();
  const { settings } = useBroadcastSettings();
  const localPermissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const [qualityOpen, setQualityOpen] = useState(false);
  const qualityAnchorRef = useRef<HTMLDivElement>(null);

  const screenMedia = useMemo(
    () => buildScreenShareMediaOptions(settings),
    [settings],
  );
  const cameraMedia = useMemo(() => buildCameraMediaOptions(settings), [settings]);
  const screenOn = localParticipant?.isScreenShareEnabled ?? false;

  const closeQuality = useCallback(() => setQualityOpen(false), []);

  useEffect(() => {
    if (!qualityOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (qualityAnchorRef.current?.contains(target)) return;
      setQualityOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [qualityOpen]);

  const canPublishSource = (source: Track.Source) => {
    if (!localPermissions?.canPublish) return false;
    if (localPermissions.canPublishSources.length === 0) return true;
    const protocol = (() => {
      switch (source) {
        case Track.Source.Camera:
          return 1;
        case Track.Source.Microphone:
          return 2;
        case Track.Source.ScreenShare:
          return 3;
        default:
          return 0;
      }
    })();
    return localPermissions.canPublishSources.includes(protocol);
  };

  const showMic = canPublishSource(Track.Source.Microphone);
  const showCam = canPublishSource(Track.Source.Camera);
  const showScreen =
    canPublishSource(Track.Source.ScreenShare) && browserSupportsScreenSharing();

  const screenLabel = screenOn
    ? compact
      ? t("broadcast.screenStopShort")
      : t("broadcast.screenStop")
    : compact
      ? t("broadcast.screenStartShort")
      : t("broadcast.screenStart");

  return (
    <footer className="broadcast-stage-dock" aria-label={t("broadcast.controlsDock")}>
      <div className="broadcast-stage-dock-inner">
        <div className="lk-control-bar broadcast-control-bar">
          <div className="broadcast-control-bar-track" role="group" aria-label={t("broadcast.controlsDock")}>
            {showMic ? (
              <div className="broadcast-control-bar-item">
                <TrackToggle
                  source={Track.Source.Microphone}
                  showIcon
                  onDeviceError={(error) =>
                    onDeviceError?.({ source: Track.Source.Microphone, error })
                  }
                >
                  {compact ? t("broadcast.micShort") : t("broadcast.mic")}
                </TrackToggle>
              </div>
            ) : null}
            {showCam ? (
              <div className="broadcast-control-bar-item">
                <TrackToggle
                  source={Track.Source.Camera}
                  showIcon
                  captureOptions={cameraMedia.captureOptions}
                  publishOptions={cameraMedia.publishOptions}
                  onDeviceError={(error) =>
                    onDeviceError?.({ source: Track.Source.Camera, error })
                  }
                >
                  {compact ? t("broadcast.cameraShort") : t("broadcast.camera")}
                </TrackToggle>
              </div>
            ) : null}
            {showScreen ? (
              <div className="broadcast-control-bar-item broadcast-control-bar-item--wide">
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  showIcon
                  captureOptions={screenMedia.captureOptions}
                  publishOptions={screenMedia.publishOptions}
                  onDeviceError={(error) =>
                    onDeviceError?.({ source: Track.Source.ScreenShare, error })
                  }
                >
                  {screenLabel}
                </TrackToggle>
              </div>
            ) : null}
            {roomId ? (
              <div className="broadcast-control-bar-item">
                <BroadcastRoomMediaButton roomId={roomId} compact={compact} />
              </div>
            ) : null}
            {roomId ? (
              <div className="broadcast-control-bar-item">
                <BroadcastRoomCineButton
                  roomId={roomId}
                  viewerRole={viewerRole ?? null}
                  compact={compact}
                />
              </div>
            ) : null}
            <div ref={qualityAnchorRef} className="broadcast-control-bar-item broadcast-control-bar-quality">
              <button
                type="button"
                className={`lk-button broadcast-control-bar-btn broadcast-quality-trigger${qualityOpen ? " is-open" : ""}`}
                aria-expanded={qualityOpen}
                aria-haspopup="dialog"
                onClick={() => setQualityOpen((v) => !v)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                {compact ? t("broadcast.qualityShort") : t("broadcast.quality")}
              </button>
              <BroadcastSettingsMenu open={qualityOpen} onClose={closeQuality} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
