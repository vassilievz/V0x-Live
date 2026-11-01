import { useCallback, useEffect, useState } from "react";

export type PushToTalkKey = "Space" | "KeyV";

export type RoomMediaSettings = {
  pushToTalk: boolean;
  pushToTalkKey: PushToTalkKey;
  audioInputId: string;
  audioOutputId: string;
  videoInputId: string;
};

export const DEFAULT_ROOM_MEDIA_SETTINGS: RoomMediaSettings = {
  pushToTalk: false,
  pushToTalkKey: "Space",
  audioInputId: "",
  audioOutputId: "",
  videoInputId: "",
};

const STORAGE_KEY = "v0x-room-media-settings";
const MEDIA_SETTINGS_EVENT = "v0x-room-media-settings";

export function loadRoomMediaSettings(): RoomMediaSettings {
  if (typeof window === "undefined") {
    return DEFAULT_ROOM_MEDIA_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ROOM_MEDIA_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<RoomMediaSettings>;
    return { ...DEFAULT_ROOM_MEDIA_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ROOM_MEDIA_SETTINGS;
  }
}

export function saveRoomMediaSettings(settings: RoomMediaSettings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(MEDIA_SETTINGS_EVENT));
}

export function useRoomMediaSettings(): [
  RoomMediaSettings,
  (patch: Partial<RoomMediaSettings>) => void,
] {
  const [settings, setSettings] = useState<RoomMediaSettings>(() => loadRoomMediaSettings());

  useEffect(() => {
    const onChange = () => setSettings(loadRoomMediaSettings());
    window.addEventListener(MEDIA_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(MEDIA_SETTINGS_EVENT, onChange);
  }, []);

  const update = useCallback((patch: Partial<RoomMediaSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveRoomMediaSettings(next);
      return next;
    });
  }, []);

  return [settings, update];
}

export function pushToTalkKeyLabel(key: PushToTalkKey): string {
  switch (key) {
    case "Space":
      return "Space";
    case "KeyV":
      return "V";
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}
