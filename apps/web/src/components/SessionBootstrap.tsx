import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useOAuthReturnSync } from "@/hooks/useOAuthReturnSync";
import { useSitePresenceHeartbeat } from "@/hooks/useSitePresenceHeartbeat";

/** Runs on every route (including `/room/:id`, which skips RootLayout). */
export function SessionBootstrap() {
  useOAuthReturnSync();
  useEnsureGuestSession();
  useSitePresenceHeartbeat();
  return null;
}
