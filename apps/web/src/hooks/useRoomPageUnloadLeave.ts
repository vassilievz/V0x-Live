import { useEffect } from "react";
import { getApiBaseUrl } from "@/lib/api";

function leaveBeaconUrl(roomId: string): string {
  const base = getApiBaseUrl();
  const path = `/api/v1/rooms/${encodeURIComponent(roomId)}/leave`;
  return base ? `${base}${path}` : path;
}

export function useRoomPageUnloadLeave(roomId: string | undefined, active: boolean) {
  useEffect(() => {
    if (!roomId || !active) {
      return;
    }
    const url = leaveBeaconUrl(roomId);
    const notifyLeave = () => {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(url, new Blob([], { type: "application/json" }));
        return;
      }
      void fetch(url, { method: "POST", credentials: "include", keepalive: true });
    };
    const onHide = () => {
      notifyLeave();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [roomId, active]);
}
