import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@v0xlive/api-client";
import { ApiError } from "@/lib/api";
import { ensureGuestSession, hasSessionCookie } from "@/lib/guestSession";
import { useSessionUser } from "@/hooks/useSessionUser";

function isOAuthGoogleReturn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("auth") === "google";
}

/**
 * Ensures an anonymous session exists before room join.
 * Reconciles cookie vs cache when cache still shows guest after Google login.
 */
export function useEnsureGuestSession() {
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const [guestPending, setGuestPending] = useState(false);

  useEffect(() => {
    const cached = queryClient.getQueryData<AuthUser>(["auth", "me"]);
    if (cached && !cached.is_guest) {
      return;
    }

    if (isOAuthGoogleReturn()) {
      return;
    }

    if (hasSessionCookie()) {
      if (session.isLoading || session.isFetching) {
        return;
      }
      if (session.isSuccess && session.data?.is_guest) {
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
      }
      if (!session.isError) {
        return;
      }
      if (!(session.error instanceof ApiError && session.error.status === 401)) {
        return;
      }
    }

    if (session.isSuccess) {
      return;
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
    session.isFetching,
    session.isError,
    session.error,
    session.data?.is_guest,
    queryClient,
  ]);

  return {
    ready: session.isSuccess,
    ensuring:
      guestPending || (hasSessionCookie() && session.isLoading && !session.isSuccess),
  };
}
