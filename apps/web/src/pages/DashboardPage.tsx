import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { DEFAULT_GUEST_DISPLAY_NAME } from "@v0xlive/api-client";
import { ArrowUpRight, KeyRound } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { authApi, roomsApi, ApiError } from "@/lib/api";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import { SitePageHead } from "@/components/layout/SitePageHead";
import { DashboardCreateVisual } from "@/features/rooms/components/DashboardCreateVisual";

function sessionDisplayName(name: string, guestLabel: string) {
  return name.trim().toLowerCase() === DEFAULT_GUEST_DISPLAY_NAME.toLowerCase()
    ? guestLabel
    : name;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [roomName, setRoomName] = useState(params.get("create") ?? "");
  const [inviteCode, setInviteCode] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: () => authApi.me(), retry: false });
  const createRoom = useMutation({
    mutationFn: () => roomsApi.create({ name: roomName.trim(), visibility }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate(`/room/${data.id}`);
    },
  });
  const joinByCode = useMutation({
    mutationFn: () => roomsApi.joinByCode(inviteCode.trim()),
    onSuccess: (data) => navigate(`/room/${data.room_id}`),
  });
  const busy = createRoom.isPending || joinByCode.isPending;
  const ready = me.isSuccess;
  const error = createRoom.error ?? joinByCode.error;
  const serviceDown = me.isError && !(me.error instanceof ApiError && me.error.status === 401);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !ready || !roomName.trim()) return;
    createRoom.mutate();
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !ready || !inviteCode.trim()) return;
    joinByCode.mutate();
  }

  const greeting = me.isSuccess ? (
    <Trans
      i18nKey="dashboard.greeting"
      values={{ name: sessionDisplayName(me.data.display_name, t("nav.guest")) }}
      components={{ strong: <strong className="text-foreground font-medium" /> }}
    />
  ) : null;

  return (
    <SiteCatalogShell>
      <section className="home-bento-panel site-panel">
        <SitePageHead
          code="DB-00"
          wideTitle
          title={t("dashboard.title")}
          description={greeting ?? t("dashboard.lead")}
          actions={
            <Link to="/rooms" className="text-link text-link--muted">
              {t("dashboard.publicRoomsLink")}
            </Link>
          }
        />
      </section>

      <section className="home-bento-panel site-panel dashboard-panel">
        {serviceDown ? (
          <p className="notice notice--error focus-page-notice dashboard-panel__notice" role="alert">
            {t("errors.serviceDown")}
          </p>
        ) : null}

        <div className="dashboard-workspace site-workspace-grid">
          <div className="site-workspace-main dashboard-workspace__main">
            <div className="catalog-form-column focus-card" aria-labelledby="create-room-title">
              <h2 id="create-room-title" className="focus-card-title">
                {t("dashboard.newRoom")}
              </h2>

              <form onSubmit={handleCreate} className="focus-card-form">
                <div className="field-group">
                  <label htmlFor="room-name">{t("dashboard.roomNameLabel")}</label>
                  <Input
                    id="room-name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder={t("dashboard.roomNamePlaceholder")}
                    required
                    maxLength={120}
                  />
                </div>
                <fieldset className="field-group">
                  <legend className="field-label mb-3">{t("dashboard.visibilityLegend")}</legend>
                  <div className="visibility-options">
                    <label className="visibility-choice">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibility === "public"}
                        onChange={() => setVisibility("public")}
                      />
                      <span>
                        <strong>{t("dashboard.publicStrong")}</strong>
                        <small>{t("dashboard.publicHint")}</small>
                      </span>
                    </label>
                    <label className="visibility-choice">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={visibility === "private"}
                        onChange={() => setVisibility("private")}
                      />
                      <span>
                        <strong>{t("dashboard.privateStrong")}</strong>
                        <small>{t("dashboard.privateHint")}</small>
                      </span>
                    </label>
                  </div>
                </fieldset>
                {error ? (
                  <p className="field-error" role="alert">
                    {error instanceof ApiError ? error.message : t("errors.generic")}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || !ready || !roomName.trim()}
                >
                  {createRoom.isPending ? t("dashboard.submitPreparing") : t("dashboard.submitCreate")}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Button>
                {!ready ? (
                  <p className="field-help" role="status">
                    {me.isLoading ? t("dashboard.connecting") : t("dashboard.waitingService")}
                  </p>
                ) : null}
              </form>

              <div className="focus-card-divider" role="separator" />

              <div className="focus-card-secondary">
                <h3 className="focus-card-subtitle">
                  <KeyRound size={16} aria-hidden="true" /> {t("dashboard.inviteTitle")}
                </h3>
                <form onSubmit={handleJoin} className="focus-card-form focus-card-form--inline">
                  <div className="field-group focus-join-row">
                    <label htmlFor="invite-code" className="sr-only">
                      {t("dashboard.inviteCodeLabel")}
                    </label>
                    <Input
                      id="invite-code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder={t("dashboard.inviteCodePlaceholder")}
                      autoComplete="off"
                      required
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={busy || !ready || !inviteCode.trim()}
                    >
                      {joinByCode.isPending ? t("dashboard.joinPending") : t("dashboard.join")}
                    </Button>
                  </div>
                  {joinByCode.error ? (
                    <p className="field-error" role="alert">
                      {joinByCode.error instanceof ApiError
                        ? joinByCode.error.message
                        : t("errors.joinRoom")}
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
          <DashboardCreateVisual />
        </div>
      </section>
    </SiteCatalogShell>
  );
}
