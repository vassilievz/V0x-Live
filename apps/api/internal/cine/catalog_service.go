package cine

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"
)

const (
	cinemetaMovieTop       = "https://v3-cinemeta.strem.io/catalog/movie/top.json"
	cinemetaSeriesTop      = "https://v3-cinemeta.strem.io/catalog/series/top.json"
	cinemetaMovieSearch    = "https://v3-cinemeta.strem.io/catalog/movie/top/search=%s.json"
	cinemetaSeriesSearch   = "https://v3-cinemeta.strem.io/catalog/series/top/search=%s.json"
	cinemetaMovieMeta      = "https://v3-cinemeta.strem.io/meta/movie/%s.json"
	cinemetaSeriesMeta     = "https://v3-cinemeta.strem.io/meta/series/%s.json"
)

var errInvalidMediaID = errors.New("invalid media id")

type CatalogService struct {
	cache     *ttlCache
	inventory *redeflixInventoryCache
	http      *http.Client
	tmdbKey   string
}

func NewCatalogService() *CatalogService {
	svc := &CatalogService{
		cache:   newTTLCache(15 * time.Minute),
		http:    &http.Client{Timeout: catalogHTTPTimeout},
		tmdbKey: strings.TrimSpace(os.Getenv("TMDB_API_KEY")),
	}
	svc.inventory = newRedeFlixInventoryCache(svc.loadRedeFlixInventory)
	return svc
}

const catalogHTTPTimeout = 12 * time.Second

func (s *CatalogService) ListCatalog(ctx context.Context, category, search string) (CatalogResponse, error) {
	category = normalizeCatalogCategory(category)
	search = strings.TrimSpace(search)

	cacheKey := fmt.Sprintf("catalog:%s:%s", category, strings.ToLower(search))
	if v, ok := s.cache.get(cacheKey); ok {
		if resp, ok := v.(CatalogResponse); ok {
			return resp, nil
		}
	}

	inv, err := s.inventory.get(ctx)
	if err != nil {
		return CatalogResponse{}, err
	}

	var items []CatalogItemDTO
	if search == "" {
		items, err = s.loadBrowseCatalog(ctx, inv, category)
	} else {
		items, err = s.searchCatalog(ctx, inv, category, search)
	}
	if err != nil {
		return CatalogResponse{}, err
	}

	if len(items) > 48 {
		items = items[:48]
	}

	resp := CatalogResponse{Items: items}
	s.cache.set(cacheKey, resp)
	return resp, nil
}

func (s *CatalogService) loadBrowseCatalog(ctx context.Context, inv *redeflixInventory, category string) ([]CatalogItemDTO, error) {
	switch category {
	case ContentFilme:
		return s.movieItemsFromCinemetaTop(ctx, inv, 48)
	case ContentSerie, ContentAnime, ContentDorama:
		return seriesEntriesToDTO(filterSeriesEntries(inv.seriesSlice(category), "")), nil
	case "all":
		var items []CatalogItemDTO
		movies, err := s.movieItemsFromCinemetaTop(ctx, inv, 24)
		if err != nil {
			return nil, err
		}
		items = append(items, movies...)
		items = append(items, seriesEntriesToDTO(filterSeriesEntries(inv.tv, ""))...)
		return items, nil
	default:
		return nil, fmt.Errorf("unknown category")
	}
}

func (s *CatalogService) searchCatalog(ctx context.Context, inv *redeflixInventory, category, search string) ([]CatalogItemDTO, error) {
	var items []CatalogItemDTO

	if category == ContentFilme || category == "all" {
		movieItems, _ := s.searchMovies(ctx, inv, search)
		items = append(items, movieItems...)
	}

	switch category {
	case ContentSerie, ContentAnime, ContentDorama:
		items = append(items, seriesEntriesToDTO(filterSeriesEntries(inv.seriesSlice(category), search))...)
	case "all":
		items = append(items, seriesEntriesToDTO(filterSeriesEntries(inv.tv, search))...)
		items = append(items, seriesEntriesToDTO(filterSeriesEntries(inv.anime, search))...)
		items = append(items, seriesEntriesToDTO(filterSeriesEntries(inv.dorama, search))...)
	}

	items = dedupeCatalogItems(items)
	return items, nil
}

func (s *CatalogService) searchMovies(ctx context.Context, inv *redeflixInventory, search string) ([]CatalogItemDTO, error) {
	encoded := url.PathEscape(search)
	u := fmt.Sprintf(cinemetaMovieSearch, encoded)
	body, err := s.fetchGET(ctx, u)
	if err != nil {
		return nil, err
	}
	var payload cinemetaCatalogPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}
	items := make([]CatalogItemDTO, 0, len(payload.Metas))
	for _, m := range payload.Metas {
		it, ok := s.cinemetaMetaToMovieItem(ctx, inv, m)
		if ok {
			items = append(items, it)
		}
	}
	return items, nil
}

func (s *CatalogService) movieItemsFromCinemetaTop(ctx context.Context, inv *redeflixInventory, limit int) ([]CatalogItemDTO, error) {
	body, err := s.fetchGET(ctx, cinemetaMovieTop)
	if err != nil {
		return nil, err
	}
	var payload cinemetaCatalogPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}
	items := make([]CatalogItemDTO, 0, limit)
	for _, m := range payload.Metas {
		it, ok := s.cinemetaMetaToMovieItem(ctx, inv, m)
		if !ok {
			continue
		}
		items = append(items, it)
		if len(items) >= limit {
			break
		}
	}
	if len(items) > 0 {
		return items, nil
	}
	// Fallback: recent TMDB ids from RedeFlix list (title only).
	for i, id := range inv.movies {
		if i >= limit {
			break
		}
		items = append(items, CatalogItemDTO{
			MediaID: strconv.Itoa(id),
			Title:   fmt.Sprintf("Filme TMDB %d", id),
			Type:    ContentFilme,
		})
	}
	return items, nil
}

func (s *CatalogService) cinemetaMetaToMovieItem(ctx context.Context, inv *redeflixInventory, m cinemetaMeta) (CatalogItemDTO, bool) {
	imdbID := strings.TrimSpace(m.ID)
	if !strings.HasPrefix(imdbID, "tt") {
		return CatalogItemDTO{}, false
	}
	tmdbID, err := s.tmdbIDFromCinemetaMovie(ctx, imdbID)
	if err != nil || tmdbID < 1 {
		return CatalogItemDTO{}, false
	}
	if _, ok := inv.moviesSet[tmdbID]; !ok {
		return CatalogItemDTO{}, false
	}
	year, _ := strconv.Atoi(strings.TrimSpace(m.Year))
	return CatalogItemDTO{
		IMDBID:     imdbID,
		MediaID:    strconv.Itoa(tmdbID),
		Title:      strings.TrimSpace(m.Name),
		Year:       year,
		Type:       ContentFilme,
		Poster:     strings.TrimSpace(m.Poster),
		IMDBRating: strings.TrimSpace(m.IMDBRating),
	}, true
}

func (s *CatalogService) GetSeriesMeta(ctx context.Context, imdbID, mediaID string) (SeriesMetaResponse, error) {
	imdbID = strings.TrimSpace(imdbID)
	mediaID = strings.TrimSpace(mediaID)

	cacheKey := "meta:series:" + strings.ToLower(imdbID) + ":" + mediaID
	if v, ok := s.cache.get(cacheKey); ok {
		if resp, ok := v.(SeriesMetaResponse); ok {
			return resp, nil
		}
	}

	inv, err := s.inventory.get(ctx)
	if err != nil {
		return SeriesMetaResponse{}, err
	}

	if ValidateMediaID(mediaID) {
		id, _ := strconv.Atoi(mediaID)
		if entry, ok := inv.byTMDB[id]; ok {
			resp := seriesMetaFromEntry(entry, imdbID, "")
			s.cache.set(cacheKey, resp)
			return resp, nil
		}
	}

	if !isValidIMDBID(imdbID) {
		return SeriesMetaResponse{}, errInvalidIMDB
	}

	metaURL := fmt.Sprintf(cinemetaSeriesMeta, url.PathEscape(imdbID))
	body, err := s.fetchGET(ctx, metaURL)
	if err != nil {
		return SeriesMetaResponse{}, err
	}
	var raw cinemetaMetaPayload
	if err := json.Unmarshal(body, &raw); err != nil {
		return SeriesMetaResponse{}, err
	}

	tmdbID, _ := moviedbIDFromMetaDetail(raw.Meta)
	poster := strings.TrimSpace(raw.Meta.Poster)
	if tmdbID > 0 {
		if entry, ok := inv.byTMDB[tmdbID]; ok {
			resp := seriesMetaFromEntry(entry, imdbID, poster)
			s.cache.set(cacheKey, resp)
			return resp, nil
		}
	}

	resp := buildSeriesMetaFromCinemeta(imdbID, raw)
	if tmdbID > 0 {
		resp.MediaID = strconv.Itoa(tmdbID)
	}
	s.cache.set(cacheKey, resp)
	return resp, nil
}

func (s *CatalogService) ResolvePlaybackMediaID(ctx context.Context, contentType, mediaID string) (string, error) {
	mediaID = strings.TrimSpace(mediaID)
	if ValidateMediaID(mediaID) {
		return mediaID, nil
	}
	if !isValidIMDBID(mediaID) {
		return "", errInvalidMediaID
	}
	if strings.EqualFold(contentType, ContentFilme) {
		id, err := s.tmdbIDFromCinemetaMovie(ctx, mediaID)
		if err != nil || id < 1 {
			return "", errInvalidMediaID
		}
		return strconv.Itoa(id), nil
	}
	if isSeriesContentType(contentType) {
		id, err := s.tmdbIDFromCinemetaSeries(ctx, mediaID)
		if err != nil || id < 1 {
			return "", errInvalidMediaID
		}
		return strconv.Itoa(id), nil
	}
	return "", errInvalidMediaID
}

func (s *CatalogService) tmdbIDFromCinemetaMovie(ctx context.Context, imdbID string) (int, error) {
	metaURL := fmt.Sprintf(cinemetaMovieMeta, url.PathEscape(imdbID))
	body, err := s.fetchGET(ctx, metaURL)
	if err != nil {
		return 0, err
	}
	var raw cinemetaMetaPayload
	if err := json.Unmarshal(body, &raw); err != nil {
		return 0, err
	}
	return moviedbIDFromMetaDetail(raw.Meta)
}

func (s *CatalogService) tmdbIDFromCinemetaSeries(ctx context.Context, imdbID string) (int, error) {
	metaURL := fmt.Sprintf(cinemetaSeriesMeta, url.PathEscape(imdbID))
	body, err := s.fetchGET(ctx, metaURL)
	if err != nil {
		return 0, err
	}
	var raw cinemetaMetaPayload
	if err := json.Unmarshal(body, &raw); err != nil {
		return 0, err
	}
	return moviedbIDFromMetaDetail(raw.Meta)
}

func moviedbIDFromMetaDetail(meta cinemetaMetaDetail) (int, error) {
	switch v := meta.MovieDBID.(type) {
	case float64:
		n := int(v)
		if n > 0 {
			return n, nil
		}
	case json.Number:
		n, err := v.Int64()
		if err == nil && n > 0 {
			return int(n), nil
		}
	case string:
		n, err := strconv.Atoi(strings.TrimSpace(v))
		if err == nil && n > 0 {
			return n, nil
		}
	}
	return 0, fmt.Errorf("missing moviedb_id")
}

func isValidIMDBID(id string) bool {
	id = strings.TrimSpace(id)
	if !strings.HasPrefix(id, "tt") || len(id) < 3 {
		return false
	}
	rest := id[2:]
	if rest == "" || len(rest) > 30 {
		return false
	}
	for _, r := range rest {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

func normalizeCatalogCategory(category string) string {
	switch strings.ToLower(strings.TrimSpace(category)) {
	case ContentFilme, "filmes", "movie", "movies":
		return ContentFilme
	case ContentSerie, "series", "tv":
		return ContentSerie
	case ContentAnime, "animes":
		return ContentAnime
	case ContentDorama, "doramas":
		return ContentDorama
	default:
		return "all"
	}
}

func dedupeCatalogItems(items []CatalogItemDTO) []CatalogItemDTO {
	seen := make(map[string]struct{})
	out := make([]CatalogItemDTO, 0, len(items))
	for _, it := range items {
		key := strings.ToLower(it.MediaID)
		if key == "" {
			key = strings.ToLower(it.IMDBID)
		}
		if key == "" {
			key = strings.ToLower(it.Title) + "|" + strconv.Itoa(it.Year)
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, it)
	}
	return out
}

type cinemetaCatalogPayload struct {
	Metas []cinemetaMeta `json:"metas"`
}

type cinemetaMeta struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Poster     string `json:"poster"`
	Year       string `json:"year"`
	IMDBRating string `json:"imdbRating"`
	Type       string `json:"type"`
}

type cinemetaMetaPayload struct {
	Meta cinemetaMetaDetail `json:"meta"`
}

type cinemetaMetaDetail struct {
	ID         string          `json:"id"`
	Name       string          `json:"name"`
	Poster     string          `json:"poster"`
	MovieDBID  any             `json:"moviedb_id"`
	Videos     []cinemetaVideo `json:"videos"`
}

type cinemetaVideo struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Season    int    `json:"season"`
	Episode   int    `json:"episode"`
	Thumbnail string `json:"thumbnail"`
}

func buildSeriesMetaFromCinemeta(imdbID string, raw cinemetaMetaPayload) SeriesMetaResponse {
	resp := SeriesMetaResponse{
		IMDBID: imdbID,
		Title:  strings.TrimSpace(raw.Meta.Name),
		Poster: strings.TrimSpace(raw.Meta.Poster),
	}
	bySeason := make(map[int][]SeriesEpisodeDTO)
	for _, v := range raw.Meta.Videos {
		if v.Season < 1 || v.Episode < 1 {
			continue
		}
		title := strings.TrimSpace(v.Title)
		if title == "" {
			title = fmt.Sprintf("Episódio %d", v.Episode)
		}
		bySeason[v.Season] = append(bySeason[v.Season], SeriesEpisodeDTO{
			Episode:   v.Episode,
			Title:     title,
			Thumbnail: strings.TrimSpace(v.Thumbnail),
		})
	}
	seasons := make([]int, 0, len(bySeason))
	for sn := range bySeason {
		seasons = append(seasons, sn)
	}
	sort.Ints(seasons)
	for _, sn := range seasons {
		eps := bySeason[sn]
		sort.Slice(eps, func(i, j int) bool { return eps[i].Episode < eps[j].Episode })
		resp.Seasons = append(resp.Seasons, SeriesSeasonDTO{
			Season:   sn,
			Episodes: eps,
		})
	}
	return resp
}

func (s *CatalogService) fetchGET(ctx context.Context, rawURL string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json, text/plain")
	req.Header.Set("User-Agent", "VoxLive-CineCatalog/2.0")

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("upstream status %d", resp.StatusCode)
	}
	const maxBody = 8 << 20
	body, err := readAllLimited(resp.Body, maxBody)
	if err != nil {
		return nil, err
	}
	return body, nil
}

// ResolveCatalogMediaID removed — use CatalogService.ResolvePlaybackMediaID.
