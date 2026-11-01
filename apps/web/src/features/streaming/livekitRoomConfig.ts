import type { AudioCaptureOptions, RoomOptions, TrackPublishOptions } from "livekit-client";
import { AudioPresets, Track } from "livekit-client";

export const VOICE_MIC_CAPTURE: AudioCaptureOptions = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: true,
};

/** System / tab audio from screen share — avoid voice DSP on music or film. */
export const SCREEN_SHARE_AUDIO_CAPTURE: AudioCaptureOptions = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  voiceIsolation: false,
};

/** Defaults applied to every LiveKit room connection in Vox Live. */
export const LIVEKIT_ROOM_OPTIONS: RoomOptions = {
  /** Off: tab-audio + UI churn can pause remote screen-share video via visibility heuristics. */
  adaptiveStream: false,
  dynacast: false,
  /** Room page handles leave via WebSocket + sendBeacon. */
  disconnectOnPageLeave: false,
  audioCaptureDefaults: VOICE_MIC_CAPTURE,
  publishDefaults: {
    audioPreset: AudioPresets.speech,
    dtx: true,
    red: true,
  },
};

export function buildMicrophonePublishOptions(): TrackPublishOptions {
  return {
    source: Track.Source.Microphone,
    audioPreset: AudioPresets.speech,
    dtx: true,
    red: true,
  };
}
