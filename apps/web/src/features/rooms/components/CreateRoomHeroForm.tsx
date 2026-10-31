import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { healthApi } from "@/lib/api";
import { useOnlineStats } from "@/hooks/useOnlineStats";
import {
  homeCreateCard,
  homeCreateFoot,
  homeCreateLabel,
  homeCreateSubmit,
  homeCreateTitle,
  homeOnlinePulse,
  statusOffline,
  statusOnline,
} from "@/ui";
import { cn } from "@/lib/cn";

export function CreateRoomHeroForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => healthApi.check(),
    retry: false,
  });
  const online = useOnlineStats();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) navigate(`/dashboard?create=${encodeURIComponent(trimmed)}`);
  }

  const serviceLabel = health.isSuccess
    ? t("createRoom.statusOnline")
    : health.isError
      ? t("createRoom.statusOffline")
      : t("createRoom.statusChecking");

  const peopleLabel =
    online.isSuccess && online.data.online >= 0
      ? t("createRoom.peopleOnline", { count: online.data.online })
      : null;

  return (
    <form onSubmit={handleSubmit} className={homeCreateCard}>
      <p className={homeCreateLabel}>{t("createRoom.label")}</p>
      <h2 className={homeCreateTitle}>{t("createRoom.title")}</h2>
      <label htmlFor="hero-room-name">{t("createRoom.fieldLabel")}</label>
      <Input
        id="hero-room-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("createRoom.placeholder")}
        autoComplete="off"
        maxLength={120}
        required
      />
      <Button type="submit" disabled={!name.trim()} className={homeCreateSubmit}>
        {t("createRoom.submit")} <ArrowUpRight size={17} aria-hidden="true" />
      </Button>
      <p className={homeCreateFoot}>
        <span>{t("createRoom.footGuest")}</span>
        <span
          className={cn(
            "inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right",
            health.isSuccess ? statusOnline : statusOffline,
          )}
          role="status"
        >
          {peopleLabel ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className={homeOnlinePulse} aria-hidden="true" />
                {peopleLabel}
              </span>
              <span className="text-muted" aria-hidden="true">
                ·
              </span>
            </>
          ) : null}
          <span>{serviceLabel}</span>
        </span>
      </p>
    </form>
  );
}
