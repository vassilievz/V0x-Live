export const CINE_OPEN_CATALOG_EVENT = "voxlive:cine-open-catalog";

export function dispatchOpenCineCatalog(): void {
  window.dispatchEvent(new Event(CINE_OPEN_CATALOG_EVENT));
}
