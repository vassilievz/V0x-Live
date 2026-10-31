import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";

/** Runs on every route (including `/room/:id`, which skips RootLayout). */
export function SessionBootstrap() {
  useEnsureGuestSession();
  return null;
}
