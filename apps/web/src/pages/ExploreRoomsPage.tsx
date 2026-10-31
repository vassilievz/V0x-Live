import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Search, Users, WifiOff } from "lucide-react";
import { Button, Input } from "@v0xlive/ui";
import { roomsApi } from "@/lib/api";
import { SiteCatalogShell } from "@/components/layout/SiteCatalogShell";
import { SitePageHead } from "@/components/layout/SitePageHead";
import { ExploreRoomsHero } from "@/features/rooms/components/ExploreRoomsHero";

function searchLocale(language: string): string {
  if (language.startsWith("pt")) return "pt-BR";
  if (language.startsWith("ru")) return "ru";
  if (language.startsWith("es")) return "es";
  return "en";
}

export function ExploreRoomsPage() {
  const [search, setSearch] = useState("");
  const { t, i18n } = useTranslation();
  const locale = searchLocale(i18n.language);
  const rooms = useQuery({ queryKey: ["rooms", "public"], queryFn: () => roomsApi.listPublic(), retry: false });
  const items =
    rooms.data?.items.filter((room) =>
      room.name.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)),
    ) ?? [];

  const countLabel = useMemo(() => {
    if (!rooms.isSuccess) {
      return t("explore.publicRooms");
    }
    return t("explore.roomsAvailable", { count: rooms.data.items.length });
  }, [rooms.data?.items.length, rooms.isSuccess, t]);

  return (
    <SiteCatalogShell>
      <ExploreRoomsHero>
        <SitePageHead
          code="RM-00"
          title={t("explore.title")}
          description={t("explore.description")}
          actions={
            <Link to="/dashboard" className="action-link action-link--pill">
              {t("explore.createRoom")} <ArrowUpRight aria-hidden="true" />
            </Link>
          }
        />
      </ExploreRoomsHero>

      <section className="home-bento-panel site-panel site-panel--flush">
        <div className="rooms-toolbar">
          <p>{countLabel}</p>
          <div className="rooms-search">
            <label htmlFor="room-search" className="sr-only">
              {t("explore.searchLabel")}
            </label>
            <Search aria-hidden="true" />
            <Input
              id="room-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("explore.searchPlaceholder")}
            />
          </div>
        </div>

        {rooms.isLoading ? (
          <div className="rooms-grid rooms-grid--explore" role="status" aria-label={t("explore.loadingAria")}>
            <div className="room-card-explore room-card-explore--skeleton" />
            <div className="room-card-explore room-card-explore--skeleton" />
            <div className="room-card-explore room-card-explore--skeleton" />
          </div>
        ) : null}

        {rooms.isError ? (
          <div className="empty-state">
            <WifiOff aria-hidden="true" />
            <span className="home-cell-code">RM-ERR</span>
            <h2>{t("explore.errorTitle")}</h2>
            <p>{t("explore.errorBody")}</p>
            <Button variant="secondary" className="mt-6" onClick={() => void rooms.refetch()} disabled={rooms.isFetching}>
              {t("explore.retry")}
            </Button>
          </div>
        ) : null}

        {rooms.isSuccess && items.length === 0 ? (
          <div className="empty-state">
            <span className="home-cell-code">RM-EMPTY</span>
            <h2>{search ? t("explore.emptySearchTitle") : t("explore.emptyTitle")}</h2>
            <p>{search ? t("explore.emptySearchBody") : t("explore.emptyBody")}</p>
            {search ? (
              <Button variant="secondary" className="mt-6" onClick={() => setSearch("")}>
                {t("explore.clearSearch")}
              </Button>
            ) : (
              <Link to="/dashboard" className="action-link action-link--pill">
                {t("explore.openMyRoom")} <ArrowUpRight aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : null}

        {rooms.isSuccess && items.length > 0 ? (
          <ul className="rooms-grid rooms-grid--explore">
            {items.map((room) => (
              <li key={room.id}>
                <Link
                  to={`/room/${room.id}`}
                  className="room-card-explore"
                  data-live={room.is_live ? "true" : "false"}
                  aria-label={t("explore.joinRoomAria", { name: room.name })}
                >
                  <div className="room-card-explore-head">
                    <span className="room-card-explore-status">
                      {room.is_live ? <span className="signal-dot" aria-hidden="true" /> : null}
                      {room.is_live ? t("explore.live") : t("explore.roomOpen")}
                    </span>
                    <span className="room-card-explore-audience">
                      <Users aria-hidden="true" />
                      {t("explore.people", { count: room.participant_count })}
                    </span>
                  </div>
                  <h2 className="room-card-explore-title">{room.name}</h2>
                  {room.description ? (
                    <p className="room-card-explore-desc">{room.description}</p>
                  ) : null}
                  <span className="text-link room-card-explore-cta">
                    {t("explore.joinRoom")} <ArrowUpRight aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </SiteCatalogShell>
  );
}
