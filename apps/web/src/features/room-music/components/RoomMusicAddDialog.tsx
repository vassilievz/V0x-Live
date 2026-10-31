import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { MonitorPlay, X } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { parseRoomMediaUrl } from "@/features/room-music/directMedia";
import { cn } from "@/lib/cn";
import {
  fieldError,
  fieldGroup,
  fieldHelp,
  fieldLabel,
  focusCard,
  focusCardForm,
  notice,
  noticeError,
  roomMusicDialog,
  roomMusicDialogBackdrop,
  roomMusicDialogClose,
  roomMusicDialogHead,
  roomMusicDialogTitle,
  roomMusicDialogVisibility,
  visibilityChoice,
} from "@/ui";

type ControlMode = "owner_only" | "everyone";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { url: string; control_mode: ControlMode }) => void;
  pending?: boolean;
  error?: string | null;
};

export function RoomMusicAddDialog({
  open,
  onClose,
  onSubmit,
  pending,
  error,
}: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [controlMode, setControlMode] = useState<ControlMode>("owner_only");
  const ownerId = useId();
  const everyoneId = useId();
  const urlId = useId();

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

  if (!open) return null;

  const valid = parseRoomMediaUrl(url.trim()) != null;

  return createPortal(
    <div className={roomMusicDialogBackdrop} role="presentation" onMouseDown={onClose}>
      <div
        className={cn(roomMusicDialog, focusCard())}
        role="dialog"
        aria-labelledby="room-music-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={roomMusicDialogHead}>
          <h2 id="room-music-dialog-title" className={roomMusicDialogTitle}>
            <MonitorPlay className="size-[18px] text-muted" aria-hidden="true" />
            {t("music.dialogTitle")}
          </h2>
          <button
            type="button"
            className={roomMusicDialogClose}
            aria-label={t("music.dialogClose")}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form
          className={focusCardForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid || pending) return;
            onSubmit({ url: url.trim(), control_mode: controlMode });
          }}
        >
          <p className={fieldHelp}>{t("music.dialogHelp")}</p>

          <fieldset className={fieldGroup}>
            <span className={fieldLabel}>{t("music.controlLegend")}</span>
            <div className={roomMusicDialogVisibility}>
              <label className={visibilityChoice} htmlFor={ownerId}>
                <input
                  id={ownerId}
                  type="radio"
                  name="control"
                  checked={controlMode === "owner_only"}
                  onChange={() => setControlMode("owner_only")}
                />
                <span>
                  <strong>{t("music.ownerOnlyStrong")}</strong>
                  <small>{t("music.ownerOnlyHint")}</small>
                </span>
              </label>
              <label className={visibilityChoice} htmlFor={everyoneId}>
                <input
                  id={everyoneId}
                  type="radio"
                  name="control"
                  checked={controlMode === "everyone"}
                  onChange={() => setControlMode("everyone")}
                />
                <span>
                  <strong>{t("music.everyoneStrong")}</strong>
                  <small>{t("music.everyoneHint")}</small>
                </span>
              </label>
            </div>
          </fieldset>

          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor={urlId}>
              {t("music.urlLabel")}
            </label>
            <Input
              id={urlId}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("music.urlPlaceholder")}
              autoComplete="off"
              aria-invalid={url.length > 0 && !valid}
            />
            {url.length > 0 && !valid ? (
              <p className={fieldError} role="alert">
                {t("music.urlInvalid")}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className={cn(notice, noticeError)} role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={!valid || pending}>
            {pending ? t("music.adding") : t("music.add")}
          </Button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
