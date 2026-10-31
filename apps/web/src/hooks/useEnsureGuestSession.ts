import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { ensureGuestSession, hasSessionCookie } from "@/lib/guestSession";
import { useSessionUser } from "@/hooks/useSessionUser";

/**
 * Ensures an anonymous session exists before room join.
 * Without a session cookie, creates guest immediately (parallel to /auth/me).
 * With a stale cookie, falls back after /auth/me returns 401.
 */
export function useEnsureGuestSession() {
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const [guestPending, setGuestPending] = useState(false);

  useEffect(() => {
    if (session.isSuccess) {
      return;
    }
    if (queryClient.getQueryData(["auth", "me"])) {
      return;
    }

    if (hasSessionCookie()) {
      if (session.isLoading) {
        return;
      }
      if (!(session.isError && session.error instanceof ApiError && session.error.status === 401)) {
        return;
      }
    }

    let active = true;
    setGuestPending(true);
    void ensureGuestSession(queryClient).finally(() => {
      if (active) {
        setGuestPending(false);
      }
    });

    return () => {
      active = false;
    };
  }, [
    session.isSuccess,
    session.isLoading,
    session.isError,
    session.error,
    queryClient,
  ]);

  return {
    ready: session.isSuccess,
    ensuring:
      guestPending || (hasSessionCookie() && session.isLoading && !session.isSuccess),
  };
}
