import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadParticipantAudioPrefs,
  saveParticipantAudioPref,
  type ParticipantAudioPref,
} from "@/features/streaming/participantAudioPrefs";

type RoomMediaUiContextValue = {
  speakingSessionIds: ReadonlySet<string>;
  setSpeakingSessionIds: (ids: Set<string>) => void;
  getPref: (sessionId: string) => ParticipantAudioPref;
  setPref: (sessionId: string, patch: Partial<ParticipantAudioPref>) => void;
};

const defaultPref: ParticipantAudioPref = { volume: 100, locallyMuted: false };

const RoomMediaUiContext = createContext<RoomMediaUiContextValue | null>(null);

export function RoomMediaUiProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const [speakingSessionIds, setSpeakingState] = useState<ReadonlySet<string>>(() => new Set());
  const [prefs, setPrefs] = useState<Record<string, ParticipantAudioPref>>(() =>
    loadParticipantAudioPrefs(roomId),
  );

  const setSpeakingSessionIds = useCallback((ids: Set<string>) => {
    setSpeakingState(new Set(ids));
  }, []);

  const getPref = useCallback(
    (sessionId: string): ParticipantAudioPref => {
      return prefs[sessionId] ?? defaultPref;
    },
    [prefs],
  );

  const setPref = useCallback(
    (sessionId: string, patch: Partial<ParticipantAudioPref>) => {
      setPrefs((prev) => {
        const nextPref = { ...(prev[sessionId] ?? defaultPref), ...patch };
        saveParticipantAudioPref(roomId, sessionId, nextPref);
        return { ...prev, [sessionId]: nextPref };
      });
    },
    [roomId],
  );

  const value = useMemo(
    () => ({
      speakingSessionIds,
      setSpeakingSessionIds,
      getPref,
      setPref,
    }),
    [getPref, setPref, speakingSessionIds],
  );

  return <RoomMediaUiContext.Provider value={value}>{children}</RoomMediaUiContext.Provider>;
}

export function useRoomMediaUi(): RoomMediaUiContextValue {
  const ctx = useContext(RoomMediaUiContext);
  if (!ctx) {
    return {
      speakingSessionIds: new Set(),
      setSpeakingSessionIds: () => undefined,
      getPref: () => defaultPref,
      setPref: () => undefined,
    };
  }
  return ctx;
}
