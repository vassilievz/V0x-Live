import { useEffect, useRef, useState } from "react";
import type { RealtimeEvent } from "@v0xlive/api-client";
import { getWsUrl } from "@/lib/api";

const MAX_CONNECT_ATTEMPTS = 8;

export function useRoomSocket(roomId: string | undefined, enabled: boolean) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId || !enabled) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let retryMs = 1000;
    let attempts = 0;
    let everConnected = false;

    function connect(fast = false) {
      if (cancelled) {
        return;
      }
      if (!fast && attempts >= MAX_CONNECT_ATTEMPTS) {
        return;
      }
      if (!fast) {
        attempts += 1;
      }
      const ws = new WebSocket(getWsUrl(roomId));
      wsRef.current = ws;

      ws.onopen = () => {
        everConnected = true;
        setConnected(true);
        retryMs = 1000;
        attempts = 0;
      };

      ws.onclose = () => {
        setConnected(false);
        if (cancelled || attempts >= MAX_CONNECT_ATTEMPTS) {
          return;
        }
        if (!everConnected && attempts >= 3) {
          return;
        }
        const delay = fast ? 250 : retryMs;
        window.setTimeout(() => connect(false), delay);
        if (!fast) {
          retryMs = Math.min(retryMs * 2, 15_000);
        }
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as RealtimeEvent;
          if (data.type === "room.closed") {
            everConnected = false;
            attempts = MAX_CONNECT_ATTEMPTS;
          }
          setLastEvent(data);
        } catch {
          /* ignore */
        }
      };
    }

    function fastReconnect() {
      const existing = wsRef.current;
      if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
        return;
      }
      connect(true);
    }

    connect(false);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fastReconnect();
      }
    };
    const onOnline = () => fastReconnect();

    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "navigate_away");
      } else {
        ws?.close();
      }
    };
  }, [roomId, enabled]);

  return { connected, lastEvent };
}
