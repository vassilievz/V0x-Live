import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

export function useSessionUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 30_000,
  });
}
