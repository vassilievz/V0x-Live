package cine

import (
	"fmt"
	"regexp"
	"strings"
)

const (
	ModeCatalog = "catalog"
	ModeDirect  = "direct"

	ContentFilme = "filme"
	ContentSerie = "serie"
)

var tmdbNumericID = regexp.MustCompile(`^[0-9]+$`)

func ValidateMediaID(id string) bool {
	id = strings.TrimSpace(id)
	if id == "" || len(id) > 12 {
		return false
	}
	return tmdbNumericID.MatchString(id)
}

func isSeriesContentType(contentType string) bool {
	switch strings.ToLower(strings.TrimSpace(contentType)) {
	case ContentSerie, ContentAnime, ContentDorama:
		return true
	default:
		return false
	}
}

type CatalogTarget struct {
	ContentType string
	MediaID     string
	Season      int
	Episode     int
	EmbedURL    string
	Title       string
}

func BuildCatalogTarget(contentType, mediaID string, season, episode int, title string) (CatalogTarget, bool) {
	contentType = strings.ToLower(strings.TrimSpace(contentType))
	mediaID = strings.TrimSpace(mediaID)
	if !ValidateMediaID(mediaID) {
		return CatalogTarget{}, false
	}
	switch contentType {
	case ContentFilme:
		return CatalogTarget{
			ContentType: ContentFilme,
			MediaID:     mediaID,
			EmbedURL:    fmt.Sprintf("%s/filme/%s", redeflixBase, mediaID),
			Title:       normalizeTitle(title, "Filme"),
		}, true
	case ContentSerie, ContentAnime, ContentDorama:
		if season < 1 || episode < 1 {
			return CatalogTarget{}, false
		}
		storedType := contentType
		if storedType == ContentAnime || storedType == ContentDorama {
			// Player URL is always /serie/ for non-film content on RedeFlixAPI.
		}
		return CatalogTarget{
			ContentType: storedType,
			MediaID:     mediaID,
			Season:      season,
			Episode:     episode,
			EmbedURL:    fmt.Sprintf("%s/serie/%s/%d/%d", redeflixBase, mediaID, season, episode),
			Title:       normalizeTitle(title, fmt.Sprintf("S%02dE%02d", season, episode)),
		}, true
	default:
		return CatalogTarget{}, false
	}
}

func normalizeTitle(title, fallback string) string {
	title = strings.TrimSpace(title)
	if title == "" {
		return fallback
	}
	if len(title) > 200 {
		return title[:200]
	}
	return title
}
