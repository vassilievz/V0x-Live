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
import { BroadcastMediaDevicesSection } from "@/features/streaming/components/BroadcastMediaDevicesSection";
import { cn } from "@/lib/cn";
import {
  fieldGroup,
  fieldHelp,
  fieldLabel,
  focusCard,
  focusCardForm,
  homeCellCode,
  roomsFilterSelect,
} from "@/ui";

type BroadcastSettingsMenuProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
};

const BITRATE_LABEL_KEY: Record<
  BroadcastBitrate,
  "broadcast.bitrateLow" | "broadcast.bitrateMedium" | "broadcast.bitrateHigh"
> = {
  low: "broadcast.bitrateLow",
  medium: "broadcast.bitrateMedium",
  high: "broadcast.bitrateHigh",
};

export function BroadcastSettingsMenu({ open, onClose, className }: BroadcastSettingsMenuProps) {
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
    <div
      className={cn(
        focusCard(),
        "w-full border-border bg-background p-4 shadow-[0_16px_48px_rgb(0_0_0/0.45)] sm:p-[18px]",
        className,
      )}
      role="dialog"
      aria-label={t("broadcast.qualityAria")}
    >
      <span className={cn(homeCellCode, "mb-2 block text-[10px]")}>BC-QLT</span>
      <p className={cn(fieldHelp, "mb-4 mt-0")}>{t("broadcast.qualityLead")}</p>

      <div className={cn(focusCardForm, "gap-3.5")}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor={profileId}>
              {t("broadcast.profile")}
            </label>
            <select
              id={profileId}
              className={cn(roomsFilterSelect, "w-full min-w-0")}
              value={settings.contentMode}
              onChange={(e) =>
                updateSettings({ contentMode: e.target.value as BroadcastContentMode })
              }
            >
              <option value="text">{t("broadcast.profileText")}</option>
              <option value="motion">{t("broadcast.profileMotion")}</option>
            </select>
          </div>

          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor="broadcast-resolution">
              {t("broadcast.resolution")}
            </label>
            <select
              id="broadcast-resolution"
              className={cn(roomsFilterSelect, "w-full min-w-0")}
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

          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor="broadcast-fps">
              {t("broadcast.fps")}
            </label>
            <select
              id="broadcast-fps"
              className={cn(roomsFilterSelect, "w-full min-w-0")}
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

          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor="broadcast-bitrate">
              {t("broadcast.bitrate")}
            </label>
            <select
              id="broadcast-bitrate"
              className={cn(roomsFilterSelect, "w-full min-w-0")}
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

        <label
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] text-foreground transition-[border-color,background] duration-[180ms] has-[:checked]:border-foreground has-[:checked]:bg-surface"
          htmlFor={smartId}
        >
          <input
            id={smartId}
            type="checkbox"
            className="size-4 accent-foreground"
            checked={settings.smartQuality}
            onChange={(e) => updateSettings({ smartQuality: e.target.checked })}
          />
          {t("broadcast.adaptive")}
        </label>
      </div>
      <BroadcastMediaDevicesSection />
    </div>
  );
}
