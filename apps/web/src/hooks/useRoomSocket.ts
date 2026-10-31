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

    function connect() {
      if (cancelled || attempts >= MAX_CONNECT_ATTEMPTS) {
        return;
      }
      attempts += 1;
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
        window.setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 15_000);
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as RealtimeEvent;
          setLastEvent(data);
        } catch {
          /* ignore */
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [roomId, enabled]);

  return { connected, lastEvent };
}
