import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { TrackToggle, useLocalParticipantPermissions } from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  buildCameraMediaOptions,
  buildScreenShareMediaOptions,
} from "@/features/streaming/broadcastSettings";
import { useBroadcastSettings } from "@/features/streaming/BroadcastSettingsContext";
import { BroadcastSettingsMenu } from "@/features/streaming/components/BroadcastSettingsMenu";

type BroadcastControlBarProps = {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
};

function browserSupportsScreenSharing(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.mediaDevices != null &&
    "getDisplayMedia" in navigator.mediaDevices
  );
}

export function BroadcastControlBar({ onDeviceError }: BroadcastControlBarProps) {
  const { t } = useTranslation();
  const { settings } = useBroadcastSettings();
  const localPermissions = useLocalParticipantPermissions();
  const [screenOn, setScreenOn] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const qualityAnchorRef = useRef<HTMLDivElement>(null);

  const screenMedia = useMemo(
    () => buildScreenShareMediaOptions(settings),
    [settings],
  );
  const cameraMedia = useMemo(() => buildCameraMediaOptions(settings), [settings]);

  const onScreenShareChange = useCallback((enabled: boolean) => {
    setScreenOn(enabled);
  }, []);

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

  return (
    <footer className="broadcast-stage-dock" aria-label={t("broadcast.controlsDock")}>
      <div className="broadcast-stage-dock-inner">
        <div className="lk-control-bar broadcast-control-bar">
      <div className="broadcast-control-bar-group">
        {showMic ? (
          <div className="lk-button-group">
            <TrackToggle
              source={Track.Source.Microphone}
              showIcon
              onDeviceError={(error) =>
                onDeviceError?.({ source: Track.Source.Microphone, error })
              }
            >
              {t("broadcast.mic")}
            </TrackToggle>
          </div>
        ) : null}
        {showCam ? (
          <div className="lk-button-group">
            <TrackToggle
              source={Track.Source.Camera}
              showIcon
              captureOptions={cameraMedia.captureOptions}
              publishOptions={cameraMedia.publishOptions}
              onDeviceError={(error) =>
                onDeviceError?.({ source: Track.Source.Camera, error })
              }
            >
              {t("broadcast.camera")}
            </TrackToggle>
          </div>
        ) : null}
        {showScreen ? (
          <TrackToggle
            source={Track.Source.ScreenShare}
            showIcon
            captureOptions={screenMedia.captureOptions}
            publishOptions={screenMedia.publishOptions}
            onChange={onScreenShareChange}
            onDeviceError={(error) =>
              onDeviceError?.({ source: Track.Source.ScreenShare, error })
            }
          >
            {screenOn ? t("broadcast.screenStop") : t("broadcast.screenStart")}
          </TrackToggle>
        ) : null}
      </div>

      <div ref={qualityAnchorRef} className="broadcast-control-bar-quality">
        <button
          type="button"
          className={`lk-button broadcast-quality-trigger${qualityOpen ? " is-open" : ""}`}
          aria-expanded={qualityOpen}
          aria-haspopup="dialog"
          onClick={() => setQualityOpen((v) => !v)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {t("broadcast.quality")}
        </button>
        <BroadcastSettingsMenu open={qualityOpen} onClose={closeQuality} />
      </div>
        </div>
      </div>
    </footer>
  );
}
