import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { syncSessionUser } from "@/lib/guestSession";

/** After Google OAuth redirect (`?auth=google`), refresh session for header and all routes. */
export function useOAuthReturnSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("auth") !== "google") {
      return;
    }

    let cancelled = false;

    void (async () => {
      const user = await syncSessionUser(queryClient);
      if (cancelled) {
        return;
      }
      if (user && !user.is_guest) {
        await queryClient.invalidateQueries({ queryKey: ["rooms", "mine"] });
      }

      params.delete("auth");
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace: true },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, navigate, queryClient]);
}
