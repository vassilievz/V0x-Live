package cine

type CatalogItemDTO struct {
	IMDBID     string  `json:"imdb_id"`
	MediaID    string  `json:"media_id"`
	Title      string  `json:"title"`
	Year       int     `json:"year,omitempty"`
	Type       string  `json:"type"`
	Poster     string  `json:"poster,omitempty"`
	IMDBRating string  `json:"imdb_rating,omitempty"`
}

type CatalogResponse struct {
	Items []CatalogItemDTO `json:"items"`
}

type SeriesEpisodeDTO struct {
	Episode   int    `json:"episode"`
	Title     string `json:"title"`
	Thumbnail string `json:"thumbnail,omitempty"`
}

type SeriesSeasonDTO struct {
	Season   int                `json:"season"`
	Episodes []SeriesEpisodeDTO `json:"episodes"`
}

type SeriesMetaResponse struct {
	IMDBID  string            `json:"imdb_id"`
	MediaID string            `json:"media_id"`
	Title   string            `json:"title"`
	Poster  string            `json:"poster,omitempty"`
	Seasons []SeriesSeasonDTO `json:"seasons"`
}
