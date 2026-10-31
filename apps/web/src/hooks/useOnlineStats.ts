import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";

export function useOnlineStats() {
  return useQuery({
    queryKey: ["stats", "online"],
    queryFn: () => statsApi.online(),
    refetchInterval: 10_000,
    staleTime: 8_000,
    retry: 1,
  });
}
