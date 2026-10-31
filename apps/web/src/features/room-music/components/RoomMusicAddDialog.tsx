import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Music2, X } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { parseYouTubeUrl } from "@/features/room-music/youtube";

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
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = parseYouTubeUrl(url) != null;

  return (
    <div className="room-music-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="room-music-dialog focus-card"
        role="dialog"
        aria-labelledby="room-music-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="room-music-dialog-head">
          <h2 id="room-music-dialog-title" className="room-music-dialog-title">
            <Music2 className="size-[18px] text-muted" aria-hidden="true" />
            {t("music.dialogTitle")}
          </h2>
          <button
            type="button"
            className="room-music-dialog-close"
            aria-label={t("music.dialogClose")}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form
          className="focus-card-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid || pending) return;
            onSubmit({ url: url.trim(), control_mode: controlMode });
          }}
        >
          <p className="field-help">{t("music.dialogHelp")}</p>

          <fieldset className="field-group">
            <span className="field-label">{t("music.controlLegend")}</span>
            <div className="visibility-options">
              <label className="visibility-choice" htmlFor={ownerId}>
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
              <label className="visibility-choice" htmlFor={everyoneId}>
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

          <div className="field-group">
            <label className="field-label" htmlFor={urlId}>
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
              <p className="field-error" role="alert">
                {t("music.urlInvalid")}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="notice notice--error" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={!valid || pending}>
            {pending ? t("music.adding") : t("music.add")}
          </Button>
        </form>
      </div>
    </div>
  );
}
