import { useEnsureGuestSession } from "@/hooks/useEnsureGuestSession";
import { useOAuthReturnSync } from "@/hooks/useOAuthReturnSync";

/** Runs on every route (including `/room/:id`, which skips RootLayout). */
export function SessionBootstrap() {
  useOAuthReturnSync();
  useEnsureGuestSession();
  return null;
}
