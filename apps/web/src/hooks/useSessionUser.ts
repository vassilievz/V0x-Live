import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, ApiError } from "@/lib/api";
import { ensureGuestSession } from "@/lib/guestSession";

function isOAuthGoogleReturn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return new URLSearchParams(window.location.search).get("auth") === "google";
}

export function useSessionUser(options?: { bootstrapGuest?: boolean }) {
  const queryClient = useQueryClient();
  const bootstrapGuest = options?.bootstrapGuest !== false;
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (
          bootstrapGuest &&
          err instanceof ApiError &&
          err.status === 401 &&
          !isOAuthGoogleReturn()
        ) {
          const guest = await ensureGuestSession(queryClient);
          if (guest) {
            return guest;
          }
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
