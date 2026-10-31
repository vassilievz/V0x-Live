import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { DEFAULT_GUEST_DISPLAY_NAME, resolveGuestAvatar } from "@v0xlive/api-client";
import { Button, Input } from "@v0xlive/ui";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useSessionUser } from "@/hooks/useSessionUser";
import { authApi, ApiError } from "@/lib/api";

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

  useEffect(() => {
    if (!open || !session.data) {
      return;
    }
    setDisplayName(
      isDefaultGuestName(session.data.display_name) ? "" : session.data.display_name,
    );
    setAvatarUrl(
      session.data.avatar_url &&
        session.data.avatar_url !== resolveGuestAvatar()
        ? session.data.avatar_url
        : "",
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
      <div className="header-session-chip header-session-chip--pending" aria-hidden="true">
        <UserAvatar name={DEFAULT_GUEST_DISPLAY_NAME} src={resolveGuestAvatar()} size="sm" />
        <span className="header-session-name">{t("nav.guest")}</span>
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
        className={`header-session-menu${open ? " is-open" : ""}`}
      >
        <div className="header-session-chip">
          <button
            type="button"
            className="header-session-chip-trigger"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls={menuId}
            aria-label={t("nav.sessionMenuAria")}
            onClick={() => setOpen((value) => !value)}
          >
            <UserAvatar name={previewName} src={previewAvatar} size="sm" />
            <span className="header-session-name">{chipLabel}</span>
          </button>
        </div>
        {open ? (
          <div
            id={menuId}
            className="header-session-dropdown home-bento"
            role="dialog"
            aria-label={t("nav.sessionMenuAria")}
          >
            <p className="header-session-dropdown-kicker">
              <span className="home-cell-code">ID</span>
              {t("nav.sessionMenuKicker")}
            </p>
            <div className="header-session-dropdown-preview">
              <UserAvatar name={previewName} src={previewAvatar} size="md" />
              <p className="header-session-dropdown-name">{chipLabel}</p>
            </div>
            <form className="header-session-dropdown-form" onSubmit={handleSave}>
              <div className="field-group">
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
              <div className="field-group">
                <label htmlFor="header-session-avatar">{t("nav.sessionAvatarLabel")}</label>
                <Input
                  id="header-session-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder={t("nav.sessionAvatarPlaceholder")}
                  inputMode="url"
                  autoComplete="off"
                />
                <p className="field-help">{t("nav.sessionAvatarHint")}</p>
              </div>
              {saveError ? (
                <p className="field-error" role="alert">
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
            <div className="header-session-dropdown-actions">
              <Link
                to="/dashboard"
                className="header-session-dropdown-item"
                onClick={() => setOpen(false)}
              >
                <LayoutGrid size={16} aria-hidden="true" />
                {t("nav.mySpace")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
      <Link to="/dashboard" className="action-link">
        {t("nav.createRoom")} <ArrowUpRight aria-hidden="true" />
      </Link>
    </>
  );
}
