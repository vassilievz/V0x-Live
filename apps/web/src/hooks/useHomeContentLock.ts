import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return !!target.closest(
    'input, textarea, select, [contenteditable="true"], [contenteditable=""]',
  );
}

function isInsideHomeLock(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return !!target.closest(".home-content-lock");
}

export function useHomeContentLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const blockClipboard = (event: ClipboardEvent) => {
      if (!isInsideHomeLock(event.target) || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const blockContextMenu = (event: MouseEvent) => {
      if (!isInsideHomeLock(event.target) || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const blockDrag = (event: DragEvent) => {
      if (!isInsideHomeLock(event.target) || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const blockSelect = (event: Event) => {
      if (!isInsideHomeLock(event.target) || isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const opts: AddEventListenerOptions = { capture: true };

    document.addEventListener("copy", blockClipboard, opts);
    document.addEventListener("cut", blockClipboard, opts);
    document.addEventListener("paste", blockClipboard, opts);
    document.addEventListener("contextmenu", blockContextMenu, opts);
    document.addEventListener("dragstart", blockDrag, opts);
    document.addEventListener("drop", blockDrag, opts);
    document.addEventListener("dragover", blockDrag, opts);
    document.addEventListener("selectstart", blockSelect, opts);

    return () => {
      document.removeEventListener("copy", blockClipboard, opts);
      document.removeEventListener("cut", blockClipboard, opts);
      document.removeEventListener("paste", blockClipboard, opts);
      document.removeEventListener("contextmenu", blockContextMenu, opts);
      document.removeEventListener("dragstart", blockDrag, opts);
      document.removeEventListener("drop", blockDrag, opts);
      document.removeEventListener("dragover", blockDrag, opts);
      document.removeEventListener("selectstart", blockSelect, opts);
    };
  }, [active]);
}
