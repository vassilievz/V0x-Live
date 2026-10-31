import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import {
  BITRATE_OPTIONS,
  FPS_OPTIONS,
  RESOLUTION_OPTIONS,
  type BroadcastBitrate,
  type BroadcastContentMode,
  type BroadcastFps,
  type BroadcastResolution,
} from "@/features/streaming/broadcastSettings";
import { useBroadcastSettings } from "@/features/streaming/BroadcastSettingsContext";

type BroadcastSettingsMenuProps = {
  open: boolean;
  onClose: () => void;
};

const BITRATE_LABEL_KEY: Record<
  BroadcastBitrate,
  "broadcast.bitrateLow" | "broadcast.bitrateMedium" | "broadcast.bitrateHigh"
> = {
  low: "broadcast.bitrateLow",
  medium: "broadcast.bitrateMedium",
  high: "broadcast.bitrateHigh",
};

export function BroadcastSettingsMenu({ open, onClose }: BroadcastSettingsMenuProps) {
  const { settings, updateSettings } = useBroadcastSettings();
  const { t } = useTranslation();
  const smartId = useId();
  const profileId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="broadcast-quality-menu" role="dialog" aria-label={t("broadcast.qualityAria")}>
      <p className="broadcast-quality-menu-lead">{t("broadcast.qualityLead")}</p>

      <div className="broadcast-quality-menu-grid">
        <div className="broadcast-quality-menu-field">
          <label htmlFor={profileId}>{t("broadcast.profile")}</label>
          <select
            id={profileId}
            value={settings.contentMode}
            onChange={(e) =>
              updateSettings({ contentMode: e.target.value as BroadcastContentMode })
            }
          >
            <option value="text">{t("broadcast.profileText")}</option>
            <option value="motion">{t("broadcast.profileMotion")}</option>
          </select>
        </div>

        <div className="broadcast-quality-menu-field">
          <label htmlFor="broadcast-resolution">{t("broadcast.resolution")}</label>
          <select
            id="broadcast-resolution"
            value={settings.resolution}
            onChange={(e) =>
              updateSettings({ resolution: e.target.value as BroadcastResolution })
            }
          >
            {RESOLUTION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="broadcast-quality-menu-field">
          <label htmlFor="broadcast-fps">{t("broadcast.fps")}</label>
          <select
            id="broadcast-fps"
            value={String(settings.fps)}
            onChange={(e) =>
              updateSettings({ fps: Number(e.target.value) as BroadcastFps })
            }
          >
            {FPS_OPTIONS.map((fps) => (
              <option key={fps} value={fps}>
                {fps}
              </option>
            ))}
          </select>
        </div>

        <div className="broadcast-quality-menu-field">
          <label htmlFor="broadcast-bitrate">{t("broadcast.bitrate")}</label>
          <select
            id="broadcast-bitrate"
            value={settings.bitrate}
            onChange={(e) =>
              updateSettings({ bitrate: e.target.value as BroadcastBitrate })
            }
          >
            {BITRATE_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {t(BITRATE_LABEL_KEY[b])}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="broadcast-quality-menu-check" htmlFor={smartId}>
        <input
          id={smartId}
          type="checkbox"
          checked={settings.smartQuality}
          onChange={(e) => updateSettings({ smartQuality: e.target.checked })}
        />
        {t("broadcast.adaptive")}
      </label>
    </div>
  );
}
