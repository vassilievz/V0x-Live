import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { healthApi } from "@/lib/api";

export function CreateRoomHeroForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => healthApi.check(),
    retry: false,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) navigate(`/dashboard?create=${encodeURIComponent(trimmed)}`);
  }

  const statusLabel = health.isSuccess
    ? t("createRoom.statusOnline")
    : health.isError
      ? t("createRoom.statusOffline")
      : t("createRoom.statusChecking");

  return (
    <form onSubmit={handleSubmit} className="home-create-card">
      <p className="home-create-label">{t("createRoom.label")}</p>
      <h2 className="home-create-title">{t("createRoom.title")}</h2>
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
      <Button type="submit" disabled={!name.trim()} className="home-create-submit">
        {t("createRoom.submit")} <ArrowUpRight size={17} aria-hidden="true" />
      </Button>
      <p className="home-create-foot">
        <span>{t("createRoom.footGuest")}</span>
        <span
          className={health.isSuccess ? "status-online" : "status-offline"}
          role="status"
        >
          {statusLabel}
        </span>
      </p>
    </form>
  );
}
