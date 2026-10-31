package cine

import (
	"testing"
)

func TestBuildSeriesMetaFromCinemeta(t *testing.T) {
	t.Parallel()
	raw := cinemetaMetaPayload{
		Meta: cinemetaMetaDetail{
			ID:     "tt0944947",
			Name:   "Game of Thrones",
			Poster: "https://example.com/poster.jpg",
			Videos: []cinemetaVideo{
				{Season: 1, Episode: 2, Title: "The Kingsroad", Thumbnail: "https://example.com/e2.jpg"},
				{Season: 1, Episode: 1, Title: "Winter is Coming"},
				{Season: 2, Episode: 1, Title: "The North Remembers"},
			},
		},
	}
	resp := buildSeriesMetaFromCinemeta("tt0944947", raw)
	if resp.Title != "Game of Thrones" || len(resp.Seasons) != 2 {
		t.Fatalf("unexpected meta: %+v", resp)
	}
	if resp.Seasons[0].Season != 1 || len(resp.Seasons[0].Episodes) != 2 {
		t.Fatalf("season 1 episodes: %+v", resp.Seasons[0])
	}
	if resp.Seasons[0].Episodes[0].Episode != 1 {
		t.Fatalf("expected episode sorted by number")
	}
}

func TestDedupeCatalogItems(t *testing.T) {
	t.Parallel()
	items := dedupeCatalogItems([]CatalogItemDTO{
		{IMDBID: "tt1", MediaID: "100", Title: "A"},
		{IMDBID: "tt1", MediaID: "100", Title: "A dup"},
		{IMDBID: "tt2", MediaID: "200", Title: "B"},
	})
	if len(items) != 2 {
		t.Fatalf("want 2 got %d", len(items))
	}
}

func TestIsValidIMDBID(t *testing.T) {
	t.Parallel()
	if !isValidIMDBID("tt0468569") {
		t.Fatal("expected valid")
	}
	if isValidIMDBID("nm123") || isValidIMDBID("tt") || isValidIMDBID("") {
		t.Fatal("expected invalid")
	}
}

func TestSeriesMetaFromEntry_temporadasMap(t *testing.T) {
	t.Parallel()
	entry := &redeflixSeriesEntry{
		IDTMDB: 86031,
		Nome:   "Dr. STONE",
		Kind:   ContentAnime,
		Temporadas: map[int][]int{
			1: {1, 2, 3},
			2: {1, 2},
		},
	}
	meta := seriesMetaFromEntry(entry, "", "")
	if meta.MediaID != "86031" || len(meta.Seasons) != 2 {
		t.Fatalf("meta: %+v", meta)
	}
	if len(meta.Seasons[0].Episodes) != 3 {
		t.Fatalf("season 1 eps: %+v", meta.Seasons[0])
	}
}
