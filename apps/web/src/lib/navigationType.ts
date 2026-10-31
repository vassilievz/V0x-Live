/** True when the current navigation was a reload (F5), not a fresh visit. */
export function isReloadNavigation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === "reload") {
    return true;
  }
  const legacy = (performance as Performance & { navigation?: { type?: number } }).navigation;
  return legacy?.type === 1;
}
