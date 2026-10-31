import type { QueryClient } from "@tanstack/react-query";
import { DEFAULT_GUEST_DISPLAY_NAME, type AuthUser } from "@v0xlive/api-client";
import { authApi } from "@/lib/api";

/** Must match API `SESSION_COOKIE_NAME` (default `v0x_session`). */
export const SESSION_COOKIE_NAME =
  import.meta.env.VITE_SESSION_COOKIE_NAME ?? "v0x_session";

let ensurePromise: Promise<AuthUser | null> | null = null;

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie.split(";").some((part) => {
    const name = part.trim().split("=")[0];
    return name === SESSION_COOKIE_NAME;
  });
}

/** Idempotent guest session; safe to call from hover, layout, and room entry. */
export function ensureGuestSession(queryClient: QueryClient): Promise<AuthUser | null> {
  const cached = queryClient.getQueryData<AuthUser>(["auth", "me"]);
  if (cached) {
    return Promise.resolve(cached);
  }

  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = authApi
    .guest(DEFAULT_GUEST_DISPLAY_NAME)
    .then((user) => {
      queryClient.setQueryData(["auth", "me"], user);
      return user;
    })
    .catch(() => null)
    .finally(() => {
      ensurePromise = null;
    });

  return ensurePromise;
}
