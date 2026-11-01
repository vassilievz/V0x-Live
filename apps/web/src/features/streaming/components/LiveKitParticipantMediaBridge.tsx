import { useEffect } from "react";
import { useRemoteParticipants } from "@livekit/components-react";
import { ParticipantEvent, Track } from "livekit-client";
import { useRoomMediaUi } from "@/features/streaming/RoomMediaUiContext";
import { livekitVolumeFromPercent } from "@/features/streaming/participantAudioPrefs";

/** Applies per-participant volume prefs and publishes speaking state to the room UI. */
export function LiveKitParticipantMediaBridge() {
  const participants = useRemoteParticipants();
  const { getPref, setSpeakingSessionIds } = useRoomMediaUi();

  useEffect(() => {
    const speaking = new Set<string>();
    const onSpeaking = (identity: string, isSpeaking: boolean) => {
      if (isSpeaking) {
        speaking.add(identity);
      } else {
        speaking.delete(identity);
      }
      setSpeakingSessionIds(new Set(speaking));
    };

    const subs: Array<() => void> = [];
    for (const p of participants) {
      const identity = p.identity;
      if (p.isSpeaking) {
        speaking.add(identity);
      }
      const handler = () => onSpeaking(identity, p.isSpeaking);
      p.on(ParticipantEvent.IsSpeakingChanged, handler);
      subs.push(() => p.off(ParticipantEvent.IsSpeakingChanged, handler));
    }
    setSpeakingSessionIds(new Set(speaking));

    return () => {
      for (const off of subs) {
        off();
      }
    };
  }, [participants, setSpeakingSessionIds]);

  useEffect(() => {
    for (const p of participants) {
      const pref = getPref(p.identity);
      const vol = pref.locallyMuted ? 0 : livekitVolumeFromPercent(pref.volume);
      p.setVolume(vol, Track.Source.Microphone);
    }
  }, [getPref, participants]);

  return null;
}
