import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { DEFAULT_GUEST_DISPLAY_NAME, resolveGuestAvatar } from "@v0xlive/api-client";
import { Button, Input } from "@v0xlive/ui";
import { UserAvatar } from "@/components/user/UserAvatar";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useSessionUser } from "@/hooks/useSessionUser";
import { authApi, ApiError } from "@/lib/api";
import { ensureGuestSession } from "@/lib/guestSession";
import { cn } from "@/lib/cn";
import {
  actionLink,
  fieldError,
  fieldGroup,
  fieldHelp,
  headerSessionChip,
  headerSessionChipPending,
  headerSessionChipTrigger,
  headerSessionDropdown,
  headerSessionDropdownActions,
  headerSessionDropdownForm,
  headerSessionDropdownItem,
  headerSessionDropdownKicker,
  headerSessionDropdownName,
  headerSessionDropdownPreview,
  headerSessionDropdownGoogle,
  headerSessionMenu,
  headerSessionMenuOpen,
  headerSessionName,
  homeCellCode,
} from "@/ui";

function isDefaultGuestName(name: string) {
  return name.trim().toLowerCase() === DEFAULT_GUEST_DISPLAY_NAME.toLowerCase();
}

export function HeaderAccount() {
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updateProfile = useMutation({
    mutationFn: (body: { display_name: string; avatar_url: string }) =>
      authApi.updateMe(body),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
      setOpen(false);
    },
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      queryClient.removeQueries({ queryKey: ["rooms", "mine"] });
      setOpen(false);
      void ensureGuestSession(queryClient);
    },
  });

  useEffect(() => {
    if (!open || !session.data) {
      return;
    }
    setDisplayName(
      isDefaultGuestName(session.data.display_name) ? "" : session.data.display_name,
    );
    const avatar = session.data.avatar_url?.trim() ?? "";
    setAvatarUrl(
      session.data.is_guest && avatar === resolveGuestAvatar()
        ? ""
        : avatar === resolveGuestAvatar()
          ? ""
          : avatar,
    );
  }, [open, session.data]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (session.isLoading && !session.data) {
    return (
      <div className={headerSessionChipPending} aria-hidden="true">
        <UserAvatar name={DEFAULT_GUEST_DISPLAY_NAME} src={resolveGuestAvatar()} size="sm" />
        <span className={headerSessionName}>{t("nav.guest")}</span>
      </div>
    );
  }

  const me = session.data ?? {
    display_name: DEFAULT_GUEST_DISPLAY_NAME,
    avatar_url: "",
    is_guest: true as const,
  };
  const sessionReady = Boolean(session.data);
  const meAvatar = resolveGuestAvatar(me.avatar_url);
  const chipLabel = isDefaultGuestName(me.display_name) ? t("nav.guest") : me.display_name;
  const previewName =
    displayName.trim() ||
    (isDefaultGuestName(me.display_name) ? DEFAULT_GUEST_DISPLAY_NAME : me.display_name);
  const previewAvatar = avatarUrl.trim() || meAvatar;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionReady) {
      return;
    }
    const name = displayName.trim();
    if (name.length < 2) {
      return;
    }
    updateProfile.mutate({
      display_name: name,
      avatar_url: avatarUrl.trim(),
    });
  }

  const saveError =
    updateProfile.error instanceof ApiError
      ? updateProfile.error.message
      : updateProfile.error
        ? t("errors.generic")
        : null;

  return (
    <>
      <div
        ref={rootRef}
        className={cn(headerSessionMenu, open && headerSessionMenuOpen)}
      >
        <div className={headerSessionChip}>
          <button
            type="button"
            className={headerSessionChipTrigger}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls={menuId}
            aria-label={t("nav.sessionMenuAria")}
            onClick={() => setOpen((value) => !value)}
          >
            <UserAvatar name={previewName} src={previewAvatar} size="sm" />
            <span className={headerSessionName}>{chipLabel}</span>
          </button>
        </div>
        {open ? (
          <div
            id={menuId}
            className={headerSessionDropdown}
            role="dialog"
            aria-label={t("nav.sessionMenuAria")}
          >
            <p className={headerSessionDropdownKicker}>
              <span className={cn(homeCellCode, "mb-0")}>ID</span>
              <span className="truncate">
                {me.is_guest ? t("nav.sessionMenuKicker") : t("nav.googleAccount")}
              </span>
            </p>
            <div className={headerSessionDropdownPreview}>
              <UserAvatar name={previewName} src={previewAvatar} size="md" />
              <div>
                <p className={headerSessionDropdownName}>{chipLabel}</p>
                {!me.is_guest && me.email ? (
                  <p className="mt-1 truncate text-xs text-muted">{me.email}</p>
                ) : null}
              </div>
            </div>
            {me.is_guest ? (
              <div className={headerSessionDropdownGoogle}>
                <GoogleSignInButton />
              </div>
            ) : null}
            <form className={headerSessionDropdownForm} onSubmit={handleSave}>
              <div className={fieldGroup}>
                <label htmlFor="header-session-name">{t("nav.sessionNameLabel")}</label>
                <Input
                  id="header-session-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("nav.sessionNamePlaceholder")}
                  minLength={2}
                  maxLength={64}
                  autoComplete="nickname"
                />
              </div>
              <div className={fieldGroup}>
                <label htmlFor="header-session-avatar">{t("nav.sessionAvatarLabel")}</label>
                <Input
                  id="header-session-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder={t("nav.sessionAvatarPlaceholder")}
                  inputMode="url"
                  autoComplete="off"
                />
                <p className={fieldHelp}>{t("nav.sessionAvatarHint")}</p>
              </div>
              {saveError ? (
                <p className={fieldError} role="alert">
                  {saveError}
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !sessionReady ||
                  updateProfile.isPending ||
                  displayName.trim().length < 2
                }
              >
                {updateProfile.isPending ? t("nav.sessionSaving") : t("nav.sessionSave")}
              </Button>
            </form>
            <div className={headerSessionDropdownActions}>
              <Link
                to="/dashboard"
                className={headerSessionDropdownItem}
                onClick={() => setOpen(false)}
              >
                <LayoutGrid size={16} aria-hidden="true" />
                {t("nav.mySpace")}
              </Link>
              {!me.is_guest ? (
                <button
                  type="button"
                  className={headerSessionDropdownItem}
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  {logout.isPending ? t("nav.signingOut") : t("nav.logout")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <Link to="/dashboard" className={actionLink}>
        {t("nav.createRoom")} <ArrowUpRight aria-hidden="true" />
      </Link>
    </>
  );
}
