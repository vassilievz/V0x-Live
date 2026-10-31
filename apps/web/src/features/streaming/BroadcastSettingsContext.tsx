import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_BROADCAST_SETTINGS,
  loadBroadcastSettings,
  saveBroadcastSettings,
  type BroadcastSettings,
} from "@/features/streaming/broadcastSettings";

type BroadcastSettingsContextValue = {
  settings: BroadcastSettings;
  updateSettings: (patch: Partial<BroadcastSettings>) => void;
};

const BroadcastSettingsContext = createContext<BroadcastSettingsContextValue | null>(
  null,
);

export function BroadcastSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BroadcastSettings>(() =>
    loadBroadcastSettings(),
  );

  const updateSettings = useCallback((patch: Partial<BroadcastSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveBroadcastSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return (
    <BroadcastSettingsContext.Provider value={value}>
      {children}
    </BroadcastSettingsContext.Provider>
  );
}

export function useBroadcastSettings(): BroadcastSettingsContextValue {
  const ctx = useContext(BroadcastSettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_BROADCAST_SETTINGS,
      updateSettings: () => {},
    };
  }
  return ctx;
}
