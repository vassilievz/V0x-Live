import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Radio } from "lucide-react";
import {
  DEFAULT_GUEST_DISPLAY_NAME,
  type AuthUser,
} from "@v0xlive/api-client";
import { Button, Input } from "@v0xlive/ui";
import { ApiError, authApi, roomsApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import {
  authForm,
  fieldError,
  fieldGroup,
  homeBentoPanel,
  homeCellCode,
  homeSectionTitle,
  siteBackLink,
  sitePanel,
  sitePanelCompact,
  siteRoomGate,
  siteRoomGateForm,
  signalLabel,
  textLink,
  textLinkMuted,
} from "@/ui";

function isDefaultGuestName(name: string) {
  return name.trim().toLowerCase() === DEFAULT_GUEST_DISPLAY_NAME.toLowerCase();
}

type Props = {
  roomId: string;
  roomName: string;
  passwordRequired: boolean;
  hasSession: boolean;
  sessionUser?: AuthUser;
  onJoined: (role: string) => void;
};

export function RoomAccessGate({
  roomId,
  roomName,
  passwordRequired,
  hasSession,
  sessionUser,
  onJoined,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sessionName = sessionUser?.display_name ?? "";
  const showNameField =
    !hasSession || (hasSession && isDefaultGuestName(sessionName));
  const resolvedSessionName = hasSession && !isDefaultGuestName(sessionName) ? sessionName : "";

  useEffect(() => {
    if (!hasSession || !sessionUser) {
      return;
    }
    if (!isDefaultGuestName(sessionUser.display_name)) {
      setDisplayName(sessionUser.display_name);
    }
  }, [hasSession, sessionUser]);

  const enter = useMutation({
    mutationFn: async () => {
      setError(null);
      const trimmedName = displayName.trim();

      if (!hasSession) {
        if (trimmedName.length < 2) {
          throw new Error(t("room.gateNameMin"));
        }
        const user = await authApi.guest(trimmedName, "");
        queryClient.setQueryData(["auth", "me"], user);
      } else if (showNameField && trimmedName.length >= 2) {
        const user = await authApi.updateMe({ display_name: trimmedName });
        queryClient.setQueryData(["auth", "me"], user);
      } else if (showNameField && trimmedName.length > 0 && trimmedName.length < 2) {
        throw new Error(t("room.gateNameMin"));
      }

      return roomsApi.join(roomId, passwordRequired ? password : undefined);
    },
    onSuccess: (data) => onJoined(data.role),
    onError: (err) =>
      setError(
        err instanceof ApiError && err.body.error === "wrong_password"
          ? t("room.gateWrongPassword")
          : err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t("room.gateJoinFailed"),
      ),
  });

  const leadText = hasSession
    ? resolvedSessionName
      ? t("room.gateLeadSessionNamed", { name: resolvedSessionName })
      : t("room.gateLeadSession")
    : t("room.gateLeadGuest");

  return (
    <SiteCatalogShell>
      <section className={cn(homeBentoPanel, sitePanel)}>
        <Link to="/rooms" className={cn(textLink, textLinkMuted, siteBackLink)}>
          {t("room.gateBack")}
        </Link>
      </section>
      <section className={cn(homeBentoPanel, sitePanelCompact)}>
        <div className={siteRoomGate}>
          <span className={homeCellCode}>RL-00</span>
          <div className={cn(signalLabel, "text-muted mb-6")}>
            <Radio size={18} aria-hidden="true" />
            <span className="text-xs">{t("room.gateKicker")}</span>
          </div>
          <h1 className={cn(homeSectionTitle, "break-words")}>{roomName}</h1>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.65] text-muted">{leadText}</p>
          <form
            className={cn(authForm, siteRoomGateForm)}
            onSubmit={(e) => {
              e.preventDefault();
              if (!enter.isPending) enter.mutate();
            }}
          >
            {showNameField ? (
              <div className={fieldGroup}>
                <label htmlFor="room-guest-name">{t("room.gateNameLabel")}</label>
                <Input
                  id="room-guest-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={64}
                  required={!hasSession}
                  placeholder={t("room.gateNamePlaceholder")}
                />
              </div>
            ) : null}
            {passwordRequired ? (
              <div className={fieldGroup}>
                <label htmlFor="room-password">{t("room.gatePasswordLabel")}</label>
                <Input
                  id="room-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            ) : null}
            {error ? (
              <p className={fieldError} role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={enter.isPending}>
              {enter.isPending ? t("room.gateJoinPending") : t("room.gateJoin")}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </section>
    </SiteCatalogShell>
  );
}
