import { useEffect, useRef } from "react";

type WakeLockSentinel = {
  release: () => Promise<void>;
};

/**
 * Keeps the screen awake while the user is in an active room (mobile Cine / calls).
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      try {
        if (lockRef.current) {
          await lockRef.current.release();
          lockRef.current = null;
        }
        const nav = navigator as Navigator & {
          wakeLock: { request: (type: "screen") => Promise<WakeLockSentinel> };
        };
        lockRef.current = await nav.wakeLock.request("screen");
      } catch {
        /* unsupported or denied */
      }
    };

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
