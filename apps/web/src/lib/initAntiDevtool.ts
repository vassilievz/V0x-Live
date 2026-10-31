import DisableDevtool from "disable-devtool";

const DEVTOOL_OPEN_REDIRECT_URL = "https://www.youtube.com/watch?v=k1-TrAvp_xs";

function redirectOnDevtoolOpen(): void {
  window.location.replace(DEVTOOL_OPEN_REDIRECT_URL);
}

function matchesKey(event: KeyboardEvent, letter: string): boolean {
  const lower = letter.toLowerCase();
  return event.key.toLowerCase() === lower || event.code === `Key${letter.toUpperCase()}`;
}

function matchesAnyKey(event: KeyboardEvent, letters: readonly string[]): boolean {
  return letters.some((letter) => matchesKey(event, letter));
}

/** Atalhos conhecidos que abrem ou acionam DevTools / view-source (Win, Linux, macOS). */
function isDevtoolsKeyboardShortcut(event: KeyboardEvent): boolean {
  if (event.code === "F12" || event.key === "F12" || event.keyCode === 123) {
    return true;
  }

  const ctrlOrMeta = event.ctrlKey || event.metaKey;
  const { shiftKey, altKey } = event;

  if (ctrlOrMeta && shiftKey && !altKey) {
    if (matchesAnyKey(event, ["i", "j", "c", "k", "m", "e", "o", "d"])) {
      return true;
    }
  }

  if (ctrlOrMeta && altKey) {
    if (matchesAnyKey(event, ["i", "j", "c", "u", "k", "e"])) {
      return true;
    }
  }

  if (ctrlOrMeta && shiftKey && altKey) {
    if (matchesAnyKey(event, ["i", "j", "c", "u", "k"])) {
      return true;
    }
  }

  if (ctrlOrMeta && !shiftKey && !altKey && matchesKey(event, "u")) {
    return true;
  }

  if (event.metaKey && event.altKey && !event.shiftKey) {
    if (matchesAnyKey(event, ["i", "j", "c", "u", "k", "e"])) {
      return true;
    }
  }

  if (event.metaKey && event.shiftKey && !event.altKey && matchesKey(event, "c")) {
    return true;
  }

  if (event.metaKey && event.shiftKey && !event.altKey && matchesKey(event, "j")) {
    return true;
  }

  return false;
}

function blockDevtoolsKeyboardEvent(event: KeyboardEvent): void {
  if (!isDevtoolsKeyboardShortcut(event)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function attachDevtoolsShortcutBlocker(): void {
  const opts: AddEventListenerOptions = { capture: true };

  for (const type of ["keydown", "keyup", "keypress"] as const) {
    window.addEventListener(type, blockDevtoolsKeyboardEvent, opts);
    document.addEventListener(type, blockDevtoolsKeyboardEvent, opts);
  }
}

/**
 * DevTools deterrence (opt-in). Desligado por padrão para facilitar debug local e testes.
 * Ative em build de produção com VITE_ENABLE_ANTI_DEVTOOL=true.
 * Desligue explicitamente com VITE_DISABLE_ANTI_DEVTOOL=true.
 */
export function initAntiDevtool(): void {
  if (import.meta.env.DEV) {
    return;
  }

  if (import.meta.env.VITE_DISABLE_ANTI_DEVTOOL === "true") {
    return;
  }

  if (import.meta.env.VITE_ENABLE_ANTI_DEVTOOL !== "true") {
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
