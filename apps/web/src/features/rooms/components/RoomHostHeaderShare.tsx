import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, KeyRound, Link2 } from "lucide-react";
import { Button } from "@v0xlive/ui";
import { cn } from "@/lib/cn";
import { roomStageActionBtn } from "@/ui";

type Props = {
  roomId: string;
  inviteCode?: string;
  isPrivate: boolean;
};

function roomShareUrl(roomId: string): string {
  if (typeof window === "undefined") {
    return `/room/${roomId}`;
  }
  return `${window.location.origin}/room/${roomId}`;
}

export function RoomHostHeaderShare({ roomId, inviteCode, isPrivate }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  const copy = useCallback(async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const link = roomShareUrl(roomId);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn(roomStageActionBtn, "gap-1.5 px-2.5 sm:px-3")}
        aria-label={copied === "link" ? t("room.shareCopied") : t("room.shareCopyLink")}
        title={copied === "link" ? t("room.shareCopied") : t("room.shareCopyLink")}
        onClick={() => void copy(link, "link")}
      >
        {copied === "link" ? (
          <Check className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Link2 className="size-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {copied === "link" ? t("room.shareCopied") : t("room.shareCopyLink")}
        </span>
      </Button>
      {isPrivate && inviteCode ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(roomStageActionBtn, "gap-1.5 px-2.5 sm:px-3")}
          aria-label={copied === "code" ? t("room.shareCopied") : t("room.shareCopyCode")}
          title={copied === "code" ? t("room.shareCopied") : t("room.shareCopyCode")}
          onClick={() => void copy(inviteCode, "code")}
        >
          {copied === "code" ? (
            <Check className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <KeyRound className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {copied === "code" ? t("room.shareCopied") : t("room.shareCopyCode")}
          </span>
        </Button>
      ) : null}
    </>
  );
}
