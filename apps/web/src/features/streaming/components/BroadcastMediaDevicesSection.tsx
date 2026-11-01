import { useCallback, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoomContext } from "@livekit/components-react";
import type { Room } from "livekit-client";
import {
  type PushToTalkKey,
  type RoomMediaSettings,
  pushToTalkKeyLabel,
  useRoomMediaSettings,
} from "@/features/streaming/roomMediaSettings";
import { cn } from "@/lib/cn";
import { fieldGroup, fieldHelp, fieldLabel, roomsFilterSelect } from "@/ui";

type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

async function listMediaDevices(): Promise<{
  audioIn: MediaDeviceOption[];
  audioOut: MediaDeviceOption[];
  videoIn: MediaDeviceOption[];
}> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return { audioIn: [], audioOut: [], videoIn: [] };
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const map = (kind: MediaDeviceKind) =>
    devices
      .filter((d) => d.kind === kind && d.deviceId)
      .map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `#${index + 1}`,
      }));

  return {
    audioIn: map("audioinput"),
    audioOut: map("audiooutput"),
    videoIn: map("videoinput"),
  };
}

async function applyAudioOutput(room: Room, deviceId: string): Promise<void> {
  if (!deviceId) {
    return;
  }
  const roomWithSwitch = room as Room & {
    switchActiveDevice?: (kind: MediaDeviceKind, deviceId: string) => Promise<void>;
    setAudioOutputDevice?: (deviceId: string) => Promise<void>;
  };
  if (roomWithSwitch.switchActiveDevice) {
    await roomWithSwitch.switchActiveDevice("audiooutput", deviceId);
    return;
  }
  if (roomWithSwitch.setAudioOutputDevice) {
    await roomWithSwitch.setAudioOutputDevice(deviceId);
    return;
  }
  if (!("setSinkId" in HTMLMediaElement.prototype)) {
    return;
  }
  const root = document.querySelector(".broadcast-room");
  const audios = root?.querySelectorAll("audio") ?? [];
  await Promise.all(
    Array.from(audios).map((el) => {
      const audio = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
      return audio.setSinkId?.(deviceId) ?? Promise.resolve();
    }),
  );
}

async function applyActiveDevice(
  room: Room,
  kind: MediaDeviceKind,
  deviceId: string,
): Promise<void> {
  if (!deviceId) {
    return;
  }
  const roomWithSwitch = room as Room & {
    switchActiveDevice?: (kind: MediaDeviceKind, deviceId: string) => Promise<void>;
  };
  if (roomWithSwitch.switchActiveDevice) {
    await roomWithSwitch.switchActiveDevice(kind, deviceId);
  }
}

export function BroadcastMediaDevicesSection() {
  const { t } = useTranslation();
  const room = useRoomContext();
  const [settings, patchSettingsState] = useRoomMediaSettings();
  const micId = useId();
  const outId = useId();
  const camId = useId();
  const pttId = useId();
  const pttKeyId = useId();

  const [devices, setDevices] = useState<{
    audioIn: MediaDeviceOption[];
    audioOut: MediaDeviceOption[];
    videoIn: MediaDeviceOption[];
  }>({ audioIn: [], audioOut: [], videoIn: [] });
  const [outputSupported, setOutputSupported] = useState(true);

  const refreshDevices = useCallback(async () => {
    try {
      const listed = await listMediaDevices();
      setDevices(listed);
      setOutputSupported(
        listed.audioOut.length > 0 ||
          "setSinkId" in HTMLMediaElement.prototype ||
          typeof (room as Room & { switchActiveDevice?: unknown }).switchActiveDevice ===
            "function",
      );
    } catch {
      setDevices({ audioIn: [], audioOut: [], videoIn: [] });
    }
  }, [room]);

  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  const patchSettings = useCallback(
    async (patch: Partial<RoomMediaSettings>) => {
      const next = { ...settings, ...patch };
      patchSettingsState(patch);
      try {
        if (patch.audioInputId !== undefined) {
          await applyActiveDevice(room, "audioinput", next.audioInputId);
        }
        if (patch.videoInputId !== undefined) {
          await applyActiveDevice(room, "videoinput", next.videoInputId);
        }
        if (patch.audioOutputId !== undefined) {
          await applyAudioOutput(room, next.audioOutputId);
        }
      } catch {
        /* device switch failed — user can retry */
      }
    },
    [patchSettingsState, room, settings],
  );

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className={cn(fieldHelp, "mb-3 mt-0")}>{t("broadcast.devicesLead")}</p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className={fieldGroup}>
          <label className={fieldLabel} htmlFor={micId}>
            {t("broadcast.microphoneInput")}
          </label>
          <select
            id={micId}
            className={cn(roomsFilterSelect, "w-full min-w-0")}
            value={settings.audioInputId}
            onChange={(e) => void patchSettings({ audioInputId: e.target.value })}
          >
            <option value="">{t("broadcast.deviceDefault")}</option>
            {devices.audioIn.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldGroup}>
          <label className={fieldLabel} htmlFor={outId}>
            {t("broadcast.audioOutput")}
          </label>
          <select
            id={outId}
            className={cn(roomsFilterSelect, "w-full min-w-0")}
            value={settings.audioOutputId}
            disabled={!outputSupported}
            onChange={(e) => void patchSettings({ audioOutputId: e.target.value })}
          >
            <option value="">{t("broadcast.deviceDefault")}</option>
            {devices.audioOut.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          {!outputSupported ? (
            <p className={fieldHelp}>{t("broadcast.outputUnsupported")}</p>
          ) : null}
        </div>

        <div className={fieldGroup}>
          <label className={fieldLabel} htmlFor={camId}>
            {t("broadcast.cameraInput")}
          </label>
          <select
            id={camId}
            className={cn(roomsFilterSelect, "w-full min-w-0")}
            value={settings.videoInputId}
            onChange={(e) => void patchSettings({ videoInputId: e.target.value })}
          >
            <option value="">{t("broadcast.deviceDefault")}</option>
            {devices.videoIn.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3.5 space-y-2.5">
        <label
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 text-[13px] text-foreground transition-[border-color,background] duration-[180ms] has-[:checked]:border-foreground has-[:checked]:bg-surface"
          htmlFor={pttId}
        >
          <input
            id={pttId}
            type="checkbox"
            className="size-4 accent-foreground"
            checked={settings.pushToTalk}
            onChange={(e) => void patchSettings({ pushToTalk: e.target.checked })}
          />
          {t("broadcast.pushToTalk")}
        </label>

        {settings.pushToTalk ? (
          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor={pttKeyId}>
              {t("broadcast.pushToTalkKey")}
            </label>
            <select
              id={pttKeyId}
              className={cn(roomsFilterSelect, "w-full min-w-0")}
              value={settings.pushToTalkKey}
              onChange={(e) =>
                void patchSettings({ pushToTalkKey: e.target.value as PushToTalkKey })
              }
            >
              <option value="Space">{pushToTalkKeyLabel("Space")}</option>
              <option value="KeyV">{pushToTalkKeyLabel("KeyV")}</option>
            </select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
