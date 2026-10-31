import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Clapperboard, X } from "lucide-react";
import type { RoomCineState, RoomCineUpsertBody } from "@v0xlive/api-client";
import { Button, Input } from "@v0xlive/ui";
import { parseDirectMediaUrl } from "@/features/room-music/directMedia";
import { CineCatalogPanel } from "@/features/room-cine/components/CineCatalogPanel";
import { cn } from "@/lib/cn";
import {
  fieldError,
  fieldGroup,
  fieldLabel,
  focusCard,
  focusCardForm,
  notice,
  noticeError,
  roomCineDialog,
  roomMusicDialogBackdrop,
  roomMusicDialogClose,
  roomMusicDialogHead,
  roomMusicDialogTitle,
} from "@/ui";

type Tab = "catalog" | "direct";

type Props = {
  open: boolean;
  onClose: () => void;
  canControl: boolean;
  state: RoomCineState | undefined;
  pending?: boolean;
  error?: string | null;
  onStartCatalog: (body: Extract<RoomCineUpsertBody, { mode: "catalog" }>) => void;
  onStartDirect: (body: Extract<RoomCineUpsertBody, { mode: "direct" }>) => void;
  onPatch: (body: { action: "prev_episode" | "next_episode" | "set_episode"; season?: number; episode?: number }) => void;
  onStop: () => void;
};

export function RoomCineDialog({
  open,
  onClose,
  canControl,
  state,
  pending,
  error,
  onStartCatalog,
  onStartDirect,
  onStop,
}: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("catalog");
  const [directUrl, setDirectUrl] = useState("");
  const directId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const directParsed = parseDirectMediaUrl(directUrl.trim());
  const directInvalid = directUrl.trim().length > 0 && directParsed == null;

  if (!open) return null;

  if (!canControl) {
    return createPortal(
      <div className={roomMusicDialogBackdrop} role="presentation" onMouseDown={onClose}>
        <div
          className={cn(roomCineDialog, focusCard())}
          role="dialog"
          aria-labelledby="room-cine-status-title"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className={roomMusicDialogHead}>
            <h2 id="room-cine-status-title" className={roomMusicDialogTitle}>
              <Clapperboard className="size-[18px] text-muted" aria-hidden="true" />
              {t("cine.dialogTitle")}
            </h2>
            <button type="button" className={roomMusicDialogClose} onClick={onClose} aria-label={t("cine.close")}>
              <X size={18} />
            </button>
          </div>
          <p className={notice}>{t("cine.hostOnlyStatus")}</p>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className={roomMusicDialogBackdrop} role="presentation" onMouseDown={onClose}>
      <div
        className={cn(roomCineDialog, focusCard())}
        role="dialog"
        aria-labelledby="room-cine-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={roomMusicDialogHead}>
          <h2 id="room-cine-dialog-title" className={roomMusicDialogTitle}>
            <Clapperboard className="size-[18px] text-muted" aria-hidden="true" />
            {t("cine.dialogTitle")}
          </h2>
          <button type="button" className={roomMusicDialogClose} onClick={onClose} aria-label={t("cine.close")}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 border-b border-border/60 pb-3">
          <button
            type="button"
            className={cn("lk-button text-sm", tab === "catalog" && "is-active")}
            onClick={() => setTab("catalog")}
          >
            {t("cine.tabCatalog")}
          </button>
          <button
            type="button"
            className={cn("lk-button text-sm", tab === "direct" && "is-active")}
            onClick={() => setTab("direct")}
          >
            {t("cine.tabDirect")}
          </button>
        </div>

        {tab === "catalog" ? (
          <div className="pt-3">
            <CineCatalogPanel pending={pending} error={error} onStartCatalog={onStartCatalog} />
            {state?.active ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                <Button type="button" variant="secondary" disabled={pending} onClick={onStop}>
                  {t("cine.stopSession")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <form
            className={focusCardForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (!directParsed || pending) return;
              onStartDirect({
                mode: "direct",
                url: directParsed.url,
              });
            }}
          >
            <p className={notice}>{t("cine.directWarning")}</p>
            <div className={fieldGroup}>
              <label className={fieldLabel} htmlFor={directId}>
                {t("cine.directUrlLabel")}
              </label>
              <Input
                id={directId}
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder={t("cine.directUrlPlaceholder")}
              />
              {directInvalid ? <p className={fieldError}>{t("cine.directUrlInvalid")}</p> : null}
            </div>
            {error ? <p className={noticeError}>{error}</p> : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={!directParsed || pending}>
                {pending ? t("cine.starting") : t("cine.startDirect")}
              </Button>
              {state?.active ? (
                <Button type="button" variant="secondary" disabled={pending} onClick={onStop}>
                  {t("cine.stopSession")}
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
