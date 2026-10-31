import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Film, Loader2, Search, Tv } from "lucide-react";
import type { CineCatalogItem, CineSeriesMeta, RoomCineUpsertBody } from "@v0xlive/api-client";
import { Button, Input } from "@v0xlive/ui";
import { cineApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  fieldGroup,
  fieldHelp,
  fieldLabel,
  notice,
  noticeError,
} from "@/ui";

const TMDB_NUMERIC_ID = /^[0-9]+$/;
const DEBOUNCE_MS = 400;
const CATALOG_RETRY_MS = 1000;

async function fetchCineCatalog(params: { category: string; search?: string }) {
  try {
    return await cineApi.catalog(params);
  } catch {
    await new Promise((resolve) => window.setTimeout(resolve, CATALOG_RETRY_MS));
    return cineApi.catalog(params);
  }
}

type CategoryFilter = "filme" | "serie" | "anime" | "dorama";

function catalogCategoryParam(filter: CategoryFilter): string {
  return filter;
}

type Props = {
  pending?: boolean;
  error?: string | null;
  onStartCatalog: (body: Extract<RoomCineUpsertBody, { mode: "catalog" }>) => void;
};

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function isSeriesCatalogType(type: CineCatalogItem["type"]): boolean {
  return type === "serie" || type === "anime" || type === "dorama";
}

function catalogTypeLabel(type: CineCatalogItem["type"], t: (key: string) => string): string {
  switch (type) {
    case "filme":
      return t("cine.typeFilme");
    case "anime":
      return t("cine.typeAnime");
    case "dorama":
      return t("cine.typeDorama");
    default:
      return t("cine.typeSerie");
  }
}

function CatalogPoster({ item, className }: { item: CineCatalogItem; className?: string }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (item.poster && !failed) {
    return (
      <img
        src={item.poster}
        alt=""
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-muted text-muted",
        className,
      )}
      aria-hidden="true"
    >
      {item.type === "filme" ? <Film className="size-8 opacity-60" /> : <Tv className="size-8 opacity-60" />}
      <span className="px-2 text-center text-[11px]">{t("cine.catalogNoPoster")}</span>
    </div>
  );
}

function CatalogCard({
  item,
  selected,
  onSelect,
}: {
  item: CineCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border/80 bg-surface-muted/40 text-left transition-[border-color,box-shadow] duration-200 hover:border-foreground/25 hover:shadow-[0_8px_24px_rgb(0_0_0/35%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected && "border-foreground/40 ring-1 ring-foreground/20",
      )}
      onClick={onSelect}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <CatalogPoster item={item} />
        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-1 p-2">
          <span className="rounded-md bg-[rgb(0_0_0/72%)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
            {catalogTypeLabel(item.type, t)}
          </span>
          {item.year ? (
            <span className="rounded-md bg-[rgb(0_0_0/72%)] px-1.5 py-0.5 text-[10px] text-foreground">{item.year}</span>
          ) : null}
          {item.imdb_rating ? (
            <span className="rounded-md bg-[rgb(0_0_0/72%)] px-1.5 py-0.5 text-[10px] text-amber-200/95">
              ★ {item.imdb_rating}
            </span>
          ) : null}
        </div>
      </div>
      <p className="line-clamp-2 px-2 py-2 text-[13px] font-medium leading-snug text-foreground">{item.title}</p>
    </button>
  );
}

function SeriesEpisodePicker({
  meta,
  mediaId,
  imdbId,
  contentType,
  pending,
  onBack,
  onTransmit,
}: {
  meta: CineSeriesMeta;
  mediaId: string;
  imdbId: string;
  contentType: CineCatalogItem["type"];
  pending?: boolean;
  onBack: () => void;
  onTransmit: (season: number, episode: number, title: string, contentType: CineCatalogItem["type"]) => void;
}) {
  const { t } = useTranslation();
  const hasSeasons = meta.seasons.length > 0;
  const [season, setSeason] = useState(hasSeasons ? meta.seasons[0].season : 1);
  const [episode, setEpisode] = useState(1);

  const seasonData = useMemo(() => {
    if (!hasSeasons) return null;
    return meta.seasons.find((s) => s.season === season) ?? meta.seasons[0];
  }, [hasSeasons, meta.seasons, season]);

  useEffect(() => {
    if (seasonData?.episodes[0]) {
      setEpisode(seasonData.episodes[0].episode);
    }
  }, [seasonData]);

  const fallbackNumeric = !hasSeasons;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground" onClick={onBack}>
        <ChevronLeft className="size-4" />
        {t("cine.catalogBackToGrid")}
      </button>
      <div className="flex gap-3 rounded-lg border border-border/70 bg-surface-muted/30 p-3">
        <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md border border-border/60">
          <CatalogPoster item={{ imdb_id: imdbId, media_id: mediaId, title: meta.title, type: contentType, poster: meta.poster }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{meta.title}</p>
          <p className="mt-1 text-xs text-muted">{t("cine.catalogPickEpisode")}</p>
        </div>
      </div>

      {hasSeasons ? (
        <>
          <div className="flex flex-wrap gap-2">
            {meta.seasons.map((s) => (
              <button
                key={s.season}
                type="button"
                className={cn("lk-button text-xs", season === s.season && "is-active")}
                onClick={() => setSeason(s.season)}
              >
                {t("cine.catalogSeasonN", { n: s.season })}
              </button>
            ))}
          </div>
          <div className="grid max-h-[280px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {seasonData?.episodes.map((ep) => (
              <button
                key={`${season}-${ep.episode}`}
                type="button"
                className={cn(
                  "flex gap-2 rounded-lg border border-border/70 p-2 text-left transition-colors hover:border-foreground/25",
                  episode === ep.episode && "border-foreground/35 bg-surface-muted/50",
                )}
                onClick={() => {
                  setEpisode(ep.episode);
                  onTransmit(season, ep.episode, `${meta.title} — T${season}:E${ep.episode} ${ep.title}`, contentType);
                }}
              >
                {ep.thumbnail ? (
                  <img src={ep.thumbnail} alt="" className="size-14 shrink-0 rounded object-cover" loading="lazy" />
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded bg-surface-muted text-xs text-muted">
                    E{ep.episode}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">
                    {t("cine.catalogEpisodeN", { n: ep.episode })}
                  </p>
                  <p className="line-clamp-2 text-sm text-foreground">{ep.title}</p>
                </div>
              </button>
            ))}
          </div>
          <Button
            type="button"
            disabled={pending || !seasonData}
            onClick={() => {
              const ep = seasonData?.episodes.find((e) => e.episode === episode);
              onTransmit(season, episode, `${meta.title} — T${season}:E${episode}${ep ? ` ${ep.title}` : ""}`, contentType);
            }}
          >
            {pending ? t("cine.starting") : t("cine.transmitEpisode")}
          </Button>
        </>
      ) : null}

      {fallbackNumeric ? (
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldGroup}>
            <label className={fieldLabel}>{t("cine.seasonLabel")}</label>
            <Input value={String(season)} inputMode="numeric" onChange={(e) => setSeason(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div className={fieldGroup}>
            <label className={fieldLabel}>{t("cine.episodeLabel")}</label>
            <Input value={String(episode)} inputMode="numeric" onChange={(e) => setEpisode(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <Button
            type="button"
            className="col-span-2"
            disabled={pending}
            onClick={() => onTransmit(season, episode, `${meta.title} — T${season}:E${episode}`, contentType)}
          >
            {pending ? t("cine.starting") : t("cine.transmitEpisode")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CineCatalogPanel({ pending, error, onStartCatalog }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>("filme");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, DEBOUNCE_MS);
  const [selected, setSelected] = useState<CineCatalogItem | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualType, setManualType] = useState<"filme" | "serie">("filme");
  const [manualSeason, setManualSeason] = useState("1");
  const [manualEpisode, setManualEpisode] = useState("1");

  const catalogQuery = useQuery({
    queryKey: ["cine-catalog", filter, debouncedSearch],
    queryFn: () =>
      fetchCineCatalog({
        category: catalogCategoryParam(filter),
        search: debouncedSearch || undefined,
      }),
    staleTime: 60_000,
    retry: false,
  });

  const metaQuery = useQuery({
    queryKey: ["cine-meta", selected?.imdb_id, selected?.media_id],
    queryFn: () =>
      cineApi.meta({
        type: "series",
        imdbId: selected!.imdb_id,
        mediaId: selected!.media_id,
      }),
    enabled: Boolean(selected && isSeriesCatalogType(selected.type) && (selected.media_id || selected.imdb_id)),
  });

  const items = catalogQuery.data?.items ?? [];

  const manualValid = useMemo(() => {
    const id = manualId.trim();
    if (!TMDB_NUMERIC_ID.test(id)) return false;
    if (manualType === "serie") {
      const s = Number(manualSeason);
      const e = Number(manualEpisode);
      return Number.isInteger(s) && s >= 1 && Number.isInteger(e) && e >= 1;
    }
    return true;
  }, [manualEpisode, manualId, manualSeason, manualType]);

  if (selected && isSeriesCatalogType(selected.type)) {
    if (metaQuery.isLoading) {
      return (
        <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted">
          <Loader2 className="size-5 animate-spin" />
          {t("cine.catalogLoadingMeta")}
        </div>
      );
    }
    if (metaQuery.data) {
      const playbackId = metaQuery.data.media_id || selected.media_id;
      return (
        <SeriesEpisodePicker
          meta={metaQuery.data}
          mediaId={playbackId}
          imdbId={selected.imdb_id ?? ""}
          contentType={selected.type}
          pending={pending}
          onBack={() => setSelected(null)}
          onTransmit={(season, episode, title, contentType) => {
            onStartCatalog({
              mode: "catalog",
              content_type: contentType,
              media_id: playbackId,
              season,
              episode,
              title,
            });
          }}
        />
      );
    }
  }

  if (selected?.type === "filme") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          onClick={() => setSelected(null)}
        >
          <ChevronLeft className="size-4" />
          {t("cine.catalogBackToGrid")}
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[200px] overflow-hidden rounded-lg border border-border/70 sm:mx-0">
            <CatalogPoster item={selected} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{selected.title}</p>
              {selected.year ? <p className="text-sm text-muted">{selected.year}</p> : null}
            </div>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                onStartCatalog({
                  mode: "catalog",
                  content_type: "filme",
                  media_id: selected.media_id,
                  title: selected.title,
                })
              }
            >
              {pending ? t("cine.starting") : t("cine.transmitFilme")}
            </Button>
          </div>
        </div>
        {error ? <p className={noticeError}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-muted">{t("cine.catalogWarningShort")}</p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("cine.catalogSearchPlaceholder")}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["filme", "serie", "anime", "dorama"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={cn("lk-button text-xs", filter === key && "is-active")}
            onClick={() => setFilter(key)}
          >
            {key === "filme"
              ? t("cine.typeFilme")
              : key === "serie"
                ? t("cine.catalogFilterSeries")
                : key === "anime"
                  ? t("cine.typeAnime")
                  : t("cine.typeDorama")}
          </button>
        ))}
      </div>

      <div className="relative min-h-[200px]">
        {catalogQuery.isFetching ? (
          <div className="absolute inset-x-0 top-0 z-[1] flex justify-center py-2">
            <Loader2 className="size-5 animate-spin text-muted" aria-label={t("cine.catalogLoading")} />
          </div>
        ) : null}
        {catalogQuery.isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className={noticeError}>{t("cine.catalogLoadError")}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void catalogQuery.refetch()}>
              {t("cine.catalogRetry")}
            </Button>
          </div>
        ) : items.length === 0 && !catalogQuery.isFetching ? (
          <p className={notice}>{t("cine.catalogEmpty")}</p>
        ) : (
          <div className="grid max-h-[min(52vh,420px)] grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
            {items.map((item) => (
              <CatalogCard
                key={`${item.media_id}-${item.title}`}
                item={item}
                selected={selected?.media_id === item.media_id}
                onSelect={() => setSelected(item)}
              />
            ))}
          </div>
        )}
      </div>

      {error ? <p className={noticeError}>{error}</p> : null}

      <div className="border-t border-border/60 pt-2">
        <button
          type="button"
          className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => setManualOpen((v) => !v)}
        >
          {t("cine.catalogManualToggle")}
        </button>
        {manualOpen ? (
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualValid || pending) return;
              onStartCatalog({
                mode: "catalog",
                content_type: manualType,
                media_id: manualId.trim(),
                season: manualType === "serie" ? Number(manualSeason) : undefined,
                episode: manualType === "serie" ? Number(manualEpisode) : undefined,
              });
            }}
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn("lk-button text-xs", manualType === "filme" && "is-active")}
                onClick={() => setManualType("filme")}
              >
                {t("cine.typeFilme")}
              </button>
              <button
                type="button"
                className={cn("lk-button text-xs", manualType === "serie" && "is-active")}
                onClick={() => setManualType("serie")}
              >
                {t("cine.typeSerie")}
              </button>
            </div>
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t("cine.mediaIdLabel")}</label>
              <Input value={manualId} onChange={(e) => setManualId(e.target.value)} />
              <p className={fieldHelp}>{t("cine.mediaIdHelp")}</p>
            </div>
            {manualType === "serie" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className={fieldGroup}>
                  <label className={fieldLabel}>{t("cine.seasonLabel")}</label>
                  <Input value={manualSeason} onChange={(e) => setManualSeason(e.target.value)} inputMode="numeric" />
                </div>
                <div className={fieldGroup}>
                  <label className={fieldLabel}>{t("cine.episodeLabel")}</label>
                  <Input value={manualEpisode} onChange={(e) => setManualEpisode(e.target.value)} inputMode="numeric" />
                </div>
              </div>
            ) : null}
            <Button type="submit" variant="secondary" disabled={!manualValid || pending}>
              {t("cine.startCatalog")}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
