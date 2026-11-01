export type ParticipantAudioPref = {
  volume: number;
  locallyMuted: boolean;
};

const STORAGE_PREFIX = "v0x-participant-audio";

function storageKey(roomId: string): string {
  return `${STORAGE_PREFIX}:${roomId}`;
}

export function loadParticipantAudioPrefs(roomId: string): Record<string, ParticipantAudioPref> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(storageKey(roomId));
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, ParticipantAudioPref>;
  } catch {
    return {};
  }
}

export function saveParticipantAudioPref(
  roomId: string,
  sessionId: string,
  pref: ParticipantAudioPref,
): void {
  const all = loadParticipantAudioPrefs(roomId);
  all[sessionId] = pref;
  window.localStorage.setItem(storageKey(roomId), JSON.stringify(all));
}

export function livekitVolumeFromPercent(percent: number): number {
  if (percent <= 0) {
    return 0;
  }
  return Math.min(2, percent / 100);
}
