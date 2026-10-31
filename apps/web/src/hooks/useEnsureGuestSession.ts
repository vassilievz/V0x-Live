import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DEFAULT_GUEST_DISPLAY_NAME } from "@v0xlive/api-client";
import { authApi, ApiError } from "@/lib/api";
import { useSessionUser } from "@/hooks/useSessionUser";

/**
 * Creates an anonymous guest session once when /auth/me returns 401.
 * Must not retry in a loop on 4xx/429 (rate limit).
 */
export function useEnsureGuestSession() {
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const ensureStarted = useRef(false);

  useEffect(() => {
    if (session.isLoading || session.isSuccess || ensureStarted.current) {
      return;
    }
    if (!(session.isError && session.error instanceof ApiError && session.error.status === 401)) {
      return;
    }

    ensureStarted.current = true;

    void authApi
      .guest(DEFAULT_GUEST_DISPLAY_NAME)
      .then((data) => {
        queryClient.setQueryData(["auth", "me"], data);
      })
      .catch(() => {
        /* keep ensureStarted true — no retry storm */
      });
  }, [session.isLoading, session.isSuccess, session.isError, session.error, queryClient]);

  return {
    ready: session.isSuccess,
    ensuring: session.isLoading || (ensureStarted.current && !session.isSuccess && session.isError),
  };
}
