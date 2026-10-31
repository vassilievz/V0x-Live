import type {
  ScreenShareCaptureOptions,
  TrackPublishOptions,
  VideoCaptureOptions,
} from "livekit-client";
import { Track } from "livekit-client";

export type BroadcastContentMode = "text" | "motion";
export type BroadcastResolution = "720p" | "1080p" | "1440p";
export type BroadcastFps = 15 | 24 | 30 | 60;
export type BroadcastBitrate = "low" | "medium" | "high";

export type BroadcastSettings = {
  smartQuality: boolean;
  contentMode: BroadcastContentMode;
  resolution: BroadcastResolution;
  fps: BroadcastFps;
  bitrate: BroadcastBitrate;
};

export const DEFAULT_BROADCAST_SETTINGS: BroadcastSettings = {
  smartQuality: true,
  contentMode: "text",
  resolution: "1080p",
  fps: 30,
  bitrate: "high",
};

const STORAGE_KEY = "v0x-broadcast-settings";

const RESOLUTIONS: Record<
  BroadcastResolution,
  { width: number; height: number }
> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "1440p": { width: 2560, height: 1440 },
};

const BITRATES: Record<BroadcastBitrate, { maxBitrate: number }> = {
  low: { maxBitrate: 1_500_000 },
  medium: { maxBitrate: 2_500_000 },
  high: { maxBitrate: 4_000_000 },
};

export function loadBroadcastSettings(): BroadcastSettings {
  if (typeof window === "undefined") {
    return DEFAULT_BROADCAST_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BROADCAST_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BroadcastSettings>;
    return { ...DEFAULT_BROADCAST_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_BROADCAST_SETTINGS;
  }
}

export function saveBroadcastSettings(settings: BroadcastSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function buildScreenShareMediaOptions(settings: BroadcastSettings): {
  captureOptions: ScreenShareCaptureOptions;
  publishOptions: TrackPublishOptions;
} {
  const res = RESOLUTIONS[settings.resolution];
  const bitrate = BITRATES[settings.bitrate];
  const contentHint = settings.contentMode === "text" ? "detail" : "motion";

  return {
    captureOptions: {
      audio: true,
      selfBrowserSurface: "include",
      contentHint,
      resolution: {
        width: res.width,
        height: res.height,
        frameRate: settings.fps,
      },
    },
    publishOptions: {
      source: Track.Source.ScreenShare,
      screenShareEncoding: {
        maxBitrate: bitrate.maxBitrate,
        maxFramerate: settings.fps,
      },
      degradationPreference:
        settings.contentMode === "text" ? "maintain-resolution" : "maintain-framerate",
      simulcast: settings.smartQuality,
    },
  };
}

export function buildCameraMediaOptions(settings: BroadcastSettings): {
  captureOptions: VideoCaptureOptions;
  publishOptions: TrackPublishOptions;
} {
  const res = RESOLUTIONS[settings.resolution];
  const bitrate = BITRATES[settings.bitrate];

  return {
    captureOptions: {
      resolution: {
        width: res.width,
        height: res.height,
        frameRate: settings.fps,
      },
    },
    publishOptions: {
      source: Track.Source.Camera,
      videoEncoding: {
        maxBitrate: bitrate.maxBitrate,
        maxFramerate: settings.fps,
      },
      degradationPreference:
        settings.contentMode === "motion" ? "maintain-framerate" : "balanced",
      simulcast: settings.smartQuality,
    },
  };
}

export const FPS_OPTIONS: BroadcastFps[] = [15, 24, 30, 60];
export const RESOLUTION_OPTIONS: BroadcastResolution[] = ["720p", "1080p", "1440p"];
export const BITRATE_OPTIONS: BroadcastBitrate[] = ["low", "medium", "high"];
