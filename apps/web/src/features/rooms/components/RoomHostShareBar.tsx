import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Link2, Lock } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { cn } from "@/lib/cn";
import { fieldGroup, fieldHelp, fieldLabel, homeCellCode } from "@/ui";

type Props = {
  roomId: string;
  visibility: string;
  inviteCode?: string;
  className?: string;
};

function roomShareUrl(roomId: string): string {
  if (typeof window === "undefined") {
    return `/room/${roomId}`;
  }
  return `${window.location.origin}/room/${roomId}`;
}

export function RoomHostShareBar({ roomId, visibility, inviteCode, className }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const isPrivate = visibility === "private";
  const link = roomShareUrl(roomId);

  const copy = useCallback(async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <section
      className={cn(
        "border-b border-[rgb(255_255_255/10%)] bg-[rgb(255_255_255/3%)] px-[clamp(14px,3vw,24px)] py-3",
        className,
      )}
      aria-label={t("room.shareTitle")}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={cn(homeCellCode, "text-[10px]")}>{t("room.shareKicker")}</span>
        {isPrivate ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-border/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            <Lock className="size-3" aria-hidden="true" />
            {t("room.sharePrivateBadge")}
          </span>
        ) : null}
      </div>
      <p className="mb-3 max-w-3xl text-[13px] leading-relaxed text-muted">
        {isPrivate ? t("room.shareLeadPrivate") : t("room.shareLeadPublic")}
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={fieldGroup}>
          <label className={fieldLabel} htmlFor="room-share-link">
            {t("room.shareLinkLabel")}
          </label>
          <div className="flex gap-2">
            <Input id="room-share-link" readOnly value={link} className="min-w-0 flex-1 font-mono text-xs" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => void copy(link, "link")}
            >
              {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied === "link" ? t("room.shareCopied") : t("room.shareCopyLink")}
            </Button>
          </div>
        </div>

        {isPrivate && inviteCode ? (
          <div className={fieldGroup}>
            <label className={fieldLabel} htmlFor="room-share-code">
              {t("dashboard.inviteCodeLabel")}
            </label>
            <div className="flex gap-2">
              <Input
                id="room-share-code"
                readOnly
                value={inviteCode}
                className="min-w-0 flex-1 font-mono text-sm tracking-[0.2em]"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => void copy(inviteCode, "code")}
              >
                {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied === "code" ? t("room.shareCopied") : t("room.shareCopyCode")}
              </Button>
            </div>
            <p className={fieldHelp}>{t("room.shareCodeHelp")}</p>
          </div>
        ) : (
          <div className={cn(fieldGroup, "hidden lg:flex lg:flex-col lg:justify-center")}>
            <p className={cn(fieldHelp, "flex items-start gap-2 m-0")}>
              <Link2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("room.sharePublicHint")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
