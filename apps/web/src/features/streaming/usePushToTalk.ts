import { useEffect, useRef } from "react";
import type { LocalParticipant } from "livekit-client";
import type { PushToTalkKey } from "@/features/streaming/roomMediaSettings";

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function matchesPushToTalkKey(event: KeyboardEvent, key: PushToTalkKey): boolean {
  return event.code === key;
}

export function usePushToTalk(
  enabled: boolean,
  key: PushToTalkKey,
  localParticipant: LocalParticipant | undefined,
) {
  const holding = useRef(false);
  const micBeforePtt = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled || !localParticipant) {
      return;
    }

    void localParticipant.setMicrophoneEnabled(false);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isTextEntryTarget(event.target)) {
        return;
      }
      if (!matchesPushToTalkKey(event, key)) {
        return;
      }
      event.preventDefault();
      if (holding.current) {
        return;
      }
      holding.current = true;
      micBeforePtt.current = localParticipant.isMicrophoneEnabled;
      void localParticipant.setMicrophoneEnabled(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!matchesPushToTalkKey(event, key)) {
        return;
      }
      if (!holding.current) {
        return;
      }
      holding.current = false;
      void localParticipant.setMicrophoneEnabled(false);
      micBeforePtt.current = null;
    };

    const onBlur = () => {
      if (!holding.current) {
        return;
      }
      holding.current = false;
      void localParticipant.setMicrophoneEnabled(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, key, localParticipant]);
}
