import type { QueryClient } from "@tanstack/react-query";
import { DEFAULT_GUEST_DISPLAY_NAME, type AuthUser } from "@v0xlive/api-client";
import { authApi, ApiError } from "@/lib/api";

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

type RefreshResult = AuthUser | "unauthorized" | null;

async function refreshSessionFromCookie(
  queryClient: QueryClient,
): Promise<RefreshResult> {
  if (!hasSessionCookie()) {
    return null;
  }
  try {
    const user = await authApi.me();
    queryClient.setQueryData(["auth", "me"], user);
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return "unauthorized";
    }
    return null;
  }
}

/** Idempotent guest session; safe to call from hover, layout, and room entry. */
export function ensureGuestSession(queryClient: QueryClient): Promise<AuthUser | null> {
  const cached = queryClient.getQueryData<AuthUser>(["auth", "me"]);
  if (cached && !cached.is_guest) {
    return Promise.resolve(cached);
  }

  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    if (hasSessionCookie()) {
      const fromCookie = await refreshSessionFromCookie(queryClient);
      if (fromCookie && fromCookie !== "unauthorized") {
        return fromCookie;
      }
      if (fromCookie === null) {
        return cached ?? null;
      }
    }

    try {
      const user = await authApi.guest(DEFAULT_GUEST_DISPLAY_NAME);
      queryClient.setQueryData(["auth", "me"], user);
      return user;
    } catch {
      return null;
    }
  })().finally(() => {
    ensurePromise = null;
  });

  return ensurePromise;
}

/** Re-sync session cookie with React Query (e.g. after Google OAuth redirect). */
export async function syncSessionUser(queryClient: QueryClient): Promise<AuthUser | null> {
  queryClient.removeQueries({ queryKey: ["auth", "me"] });
  if (!hasSessionCookie()) {
    return null;
  }
  const fromCookie = await refreshSessionFromCookie(queryClient);
  if (fromCookie && fromCookie !== "unauthorized") {
    return fromCookie;
  }
  return null;
}
