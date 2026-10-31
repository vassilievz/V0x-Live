import DisableDevtool from "disable-devtool";

const DEVTOOL_OPEN_REDIRECT_URL = "https://www.youtube.com/watch?v=k1-TrAvp_xs";

function redirectOnDevtoolOpen(): void {
  window.location.replace(DEVTOOL_OPEN_REDIRECT_URL);
}

/** Blocks common DevTools shortcuts without navigating away (YouTube is only on detected open). */
function attachDevtoolsShortcutBlocker(): void {
  const blocked = (event: KeyboardEvent): boolean => {
    const key = event.key.toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    if (key === "f12") {
      return true;
    }

    if (ctrlOrMeta && shift && (key === "i" || key === "j" || key === "c" || key === "k")) {
      return true;
    }

    if (ctrlOrMeta && alt && (key === "i" || key === "j" || key === "c" || key === "u")) {
      return true;
    }

    if (ctrlOrMeta && key === "u") {
      return true;
    }

    return false;
  };

  window.addEventListener(
    "keydown",
    (event) => {
      if (!blocked(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}

/**
 * Production-only DevTools deterrence: shortcut block + redirect when DevTools opens.
 * Skipped in dev so local debugging stays usable.
 */
export function initAntiDevtool(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  if (import.meta.env.VITE_DISABLE_ANTI_DEVTOOL === "true") {
    return;
  }

  attachDevtoolsShortcutBlocker();

  DisableDevtool({
    url: DEVTOOL_OPEN_REDIRECT_URL,
    timeOutUrl: DEVTOOL_OPEN_REDIRECT_URL,
    disableMenu: true,
    disableSelect: false,
    disableCopy: false,
    disableCut: false,
    disablePaste: false,
    clearLog: true,
    ondevtoolopen(_type, next) {
      redirectOnDevtoolOpen();
      next();
    },
  });
}
