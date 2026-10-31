package cine

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	redeflixBase           = "https://redeflixapi.bar"
	redeflixListMovies     = redeflixBase + "/list-movie-ids.txt"
	redeflixListTV         = redeflixBase + "/list-tv-ids.txt"
	redeflixListAnime      = redeflixBase + "/list-anime-ids.txt"
	redeflixListDorama      = redeflixBase + "/list-dorama-ids.txt"
	redeflixInventoryTTL     = 30 * time.Minute
	redeflixInventoryTimeout = 45 * time.Second
)

const (
	ContentAnime  = "anime"
	ContentDorama = "dorama"
)

type redeflixSeriesItem struct {
	IDTMDB     int                       `json:"id_tmdb"`
	Nome       string                    `json:"nome"`
	Ano        *int                      `json:"ano"`
	Temporadas map[string]json.RawMessage `json:"temporadas"`
}

type redeflixSeriesListPayload struct {
	Items []redeflixSeriesItem `json:"items"`
}

type redeflixSeriesEntry struct {
	IDTMDB     int
	Nome       string
	Ano        int
	Kind       string
	Temporadas map[int][]int
}

type redeflixInventory struct {
	loadedAt time.Time
	movies   []int
	moviesSet map[int]struct{}
	tv        []redeflixSeriesEntry
	anime     []redeflixSeriesEntry
	dorama    []redeflixSeriesEntry
	byTMDB    map[int]*redeflixSeriesEntry
}

type redeflixInventoryCache struct {
	mu      sync.RWMutex
	expires time.Time
	inv     *redeflixInventory
	load    func(context.Context) (*redeflixInventory, error)
}

func newRedeFlixInventoryCache(fetch func(context.Context) (*redeflixInventory, error)) *redeflixInventoryCache {
	return &redeflixInventoryCache{load: fetch}
}

func (c *redeflixInventoryCache) get(ctx context.Context) (*redeflixInventory, error) {
	c.mu.RLock()
	if c.inv != nil && time.Now().Before(c.expires) {
		inv := c.inv
		c.mu.RUnlock()
		return inv, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()
	if c.inv != nil && time.Now().Before(c.expires) {
		return c.inv, nil
	}
	inv, err := c.load(ctx)
	if err != nil {
		return nil, err
	}
	c.inv = inv
	c.expires = time.Now().Add(redeflixInventoryTTL)
	return inv, nil
}

func parseTemporadas(raw map[string]json.RawMessage) (map[int][]int, error) {
	out := make(map[int][]int, len(raw))
	for seasonKey, value := range raw {
		season, err := strconv.Atoi(strings.TrimSpace(seasonKey))
		if err != nil || season < 1 {
			continue
		}
		eps, err := episodesFromTemporadaValue(value)
		if err != nil || len(eps) == 0 {
			continue
		}
		out[season] = eps
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("empty temporadas")
	}
	return out, nil
}

func episodesFromTemporadaValue(raw json.RawMessage) ([]int, error) {
	var count int
	if err := json.Unmarshal(raw, &count); err == nil {
		if count < 1 {
			return nil, fmt.Errorf("invalid count")
		}
		eps := make([]int, count)
		for i := 1; i <= count; i++ {
			eps[i-1] = i
		}
		return eps, nil
	}
	var listed []int
	if err := json.Unmarshal(raw, &listed); err == nil && len(listed) > 0 {
		sort.Ints(listed)
		return listed, nil
	}
	return nil, fmt.Errorf("unsupported temporada shape")
}

func seriesEntryFromItem(item redeflixSeriesItem, kind string) (redeflixSeriesEntry, error) {
	temporadas, err := parseTemporadas(item.Temporadas)
	if err != nil {
		return redeflixSeriesEntry{}, err
	}
	year := 0
	if item.Ano != nil {
		year = *item.Ano
	}
	return redeflixSeriesEntry{
		IDTMDB:     item.IDTMDB,
		Nome:       strings.TrimSpace(item.Nome),
		Ano:        year,
		Kind:       kind,
		Temporadas: temporadas,
	}, nil
}

func (s *CatalogService) loadRedeFlixInventory(ctx context.Context) (*redeflixInventory, error) {
	loadCtx, cancel := context.WithTimeout(ctx, redeflixInventoryTimeout)
	defer cancel()

	movies, err := s.fetchRedeFlixMovieIDs(loadCtx)
	if err != nil {
		return nil, err
	}
	moviesSet := make(map[int]struct{}, len(movies))
	for _, id := range movies {
		moviesSet[id] = struct{}{}
	}

	tv, err := s.fetchRedeFlixSeriesList(loadCtx, redeflixListTV, ContentSerie)
	if err != nil {
		return nil, err
	}
	anime, err := s.fetchRedeFlixSeriesList(loadCtx, redeflixListAnime, ContentAnime)
	if err != nil {
		return nil, err
	}
	dorama, err := s.fetchRedeFlixSeriesList(loadCtx, redeflixListDorama, ContentDorama)
	if err != nil {
		return nil, err
	}

	byTMDB := make(map[int]*redeflixSeriesEntry)
	for i := range tv {
		entry := tv[i]
		byTMDB[entry.IDTMDB] = &entry
	}
	for i := range anime {
		entry := anime[i]
		byTMDB[entry.IDTMDB] = &entry
	}
	for i := range dorama {
		entry := dorama[i]
		byTMDB[entry.IDTMDB] = &entry
	}

	return &redeflixInventory{
		loadedAt:  time.Now().UTC(),
		movies:    movies,
		moviesSet: moviesSet,
		tv:        tv,
		anime:     anime,
		dorama:    dorama,
		byTMDB:    byTMDB,
	}, nil
}

func (s *CatalogService) fetchRedeFlixMovieIDs(ctx context.Context) ([]int, error) {
	body, err := s.fetchGET(ctx, redeflixListMovies)
	if err != nil {
		return nil, err
	}
	scanner := bufio.NewScanner(strings.NewReader(string(body)))
	ids := make([]int, 0, 4096)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		id, err := strconv.Atoi(line)
		if err != nil || id < 1 {
			continue
		}
		ids = append(ids, id)
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return nil, fmt.Errorf("empty movie list")
	}
	return ids, nil
}

func (s *CatalogService) fetchRedeFlixSeriesList(ctx context.Context, rawURL, kind string) ([]redeflixSeriesEntry, error) {
	body, err := s.fetchGET(ctx, rawURL)
	if err != nil {
		return nil, err
	}
	var payload redeflixSeriesListPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}
	out := make([]redeflixSeriesEntry, 0, len(payload.Items))
	for _, item := range payload.Items {
		if item.IDTMDB < 1 {
			continue
		}
		entry, err := seriesEntryFromItem(item, kind)
		if err != nil {
			continue
		}
		out = append(out, entry)
	}
	return out, nil
}

func (inv *redeflixInventory) seriesSlice(category string) []redeflixSeriesEntry {
	switch category {
	case ContentAnime:
		return inv.anime
	case ContentDorama:
		return inv.dorama
	case ContentSerie:
		return inv.tv
	default:
		return nil
	}
}

func seriesMetaFromEntry(entry *redeflixSeriesEntry, imdbID, poster string) SeriesMetaResponse {
	resp := SeriesMetaResponse{
		IMDBID:  imdbID,
		MediaID: strconv.Itoa(entry.IDTMDB),
		Title:   entry.Nome,
		Poster:  poster,
	}
	seasons := make([]int, 0, len(entry.Temporadas))
	for sn := range entry.Temporadas {
		seasons = append(seasons, sn)
	}
	sort.Ints(seasons)
	for _, sn := range seasons {
		eps := entry.Temporadas[sn]
		dtos := make([]SeriesEpisodeDTO, 0, len(eps))
		for _, ep := range eps {
			dtos = append(dtos, SeriesEpisodeDTO{
				Episode: ep,
				Title:   fmt.Sprintf("Episódio %d", ep),
			})
		}
		resp.Seasons = append(resp.Seasons, SeriesSeasonDTO{
			Season:   sn,
			Episodes: dtos,
		})
	}
	return resp
}

func filterSeriesEntries(entries []redeflixSeriesEntry, search string) []redeflixSeriesEntry {
	search = strings.TrimSpace(strings.ToLower(search))
	if search == "" {
		return entries
	}
	out := make([]redeflixSeriesEntry, 0, 48)
	for _, e := range entries {
		if strings.Contains(strings.ToLower(e.Nome), search) {
			out = append(out, e)
			if len(out) >= 96 {
				break
			}
		}
	}
	return out
}

func seriesEntriesToDTO(entries []redeflixSeriesEntry) []CatalogItemDTO {
	limit := len(entries)
	if limit > 48 {
		limit = 48
	}
	items := make([]CatalogItemDTO, 0, limit)
	for i := 0; i < limit; i++ {
		e := entries[i]
		items = append(items, CatalogItemDTO{
			MediaID: strconv.Itoa(e.IDTMDB),
			Title:   e.Nome,
			Year:    e.Ano,
			Type:    e.Kind,
		})
	}
	return items
}

func readAllLimited(r io.Reader, max int64) ([]byte, error) {
	return io.ReadAll(io.LimitReader(r, max))
}
