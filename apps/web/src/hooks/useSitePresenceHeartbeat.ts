import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { presenceApi } from "@/lib/api";
import { ensureGuestSession } from "@/lib/guestSession";

const HEARTBEAT_MS = 10_000;

/** Keeps this browser tab counted in global online stats (guests and logged-in users). */
export function useSitePresenceHeartbeat() {
  const queryClient = useQueryClient();
  const tickingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function pulse() {
      if (tickingRef.current || cancelled) {
        return;
      }
      tickingRef.current = true;
      try {
        await ensureGuestSession(queryClient);
        await presenceApi.heartbeat();
      } catch {
        // ignore — next interval or focus will retry
      } finally {
        tickingRef.current = false;
      }
    }

    void pulse();

    timer = setInterval(() => {
      void pulse();
    }, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void pulse();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient]);
}
