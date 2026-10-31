import { useTranslation } from "react-i18next";

export type BentoMetaPreset =
  | "default"
  | "explore"
  | "notFound"
  | "roomLoading"
  | "roomError"
  | "roomJoining"
  | "roomGate";

const PRESET_KEYS: Record<BentoMetaPreset, readonly [string, string, string, string]> = {
  default: [
    "bentoMeta.brand",
    "bentoMeta.groupBroadcast",
    "bentoMeta.stack",
    "bentoMeta.free",
  ],
  explore: [
    "bentoMeta.brand",
    "bentoMeta.explore",
    "bentoMeta.publicRooms",
    "bentoMeta.live",
  ],
  notFound: [
    "bentoMeta.brand",
    "bentoMeta.error",
    "bentoMeta.notFound",
    "bentoMeta.unavailable",
  ],
  roomLoading: [
    "bentoMeta.brand",
    "bentoMeta.room",
    "bentoMeta.loading",
    "bentoMeta.stack",
  ],
  roomError: [
    "bentoMeta.brand",
    "bentoMeta.room",
    "bentoMeta.error",
    "bentoMeta.unavailable",
  ],
  roomJoining: [
    "bentoMeta.brand",
    "bentoMeta.room",
    "bentoMeta.joining",
    "bentoMeta.stack",
  ],
  roomGate: [
    "bentoMeta.brand",
    "bentoMeta.room",
    "bentoMeta.entry",
    "bentoMeta.stack",
  ],
};

export function useBentoMeta(preset: BentoMetaPreset = "default"): string[] {
  const { t } = useTranslation();
  return PRESET_KEYS[preset].map((key) => t(key));
}
