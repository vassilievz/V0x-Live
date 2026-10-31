package cine

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestValidateMediaID_numericTMDBOnly(t *testing.T) {
	t.Parallel()
	bad := []string{"", "../1", "12/34", "abc?x=1", "a b", "tt1234567", strings.Repeat("1", 13)}
	for _, id := range bad {
		if ValidateMediaID(id) {
			t.Fatalf("expected reject for %q", id)
		}
	}
	if !ValidateMediaID("19995") {
		t.Fatal("expected valid numeric tmdb id")
	}
}

func TestBuildCatalogTarget_filme(t *testing.T) {
	got, ok := BuildCatalogTarget(ContentFilme, "19995", 0, 0, "Avatar")
	if !ok {
		t.Fatal("expected ok")
	}
	if got.EmbedURL != "https://redeflixapi.bar/filme/19995" {
		t.Fatalf("embed = %q", got.EmbedURL)
	}
}

func TestBuildCatalogTarget_serie(t *testing.T) {
	got, ok := BuildCatalogTarget(ContentSerie, "86031", 1, 1, "")
	if !ok {
		t.Fatal("expected ok")
	}
	if got.EmbedURL != "https://redeflixapi.bar/serie/86031/1/1" {
		t.Fatalf("embed = %q", got.EmbedURL)
	}
}

func TestBuildCatalogTarget_animeUsesSeriePath(t *testing.T) {
	got, ok := BuildCatalogTarget(ContentAnime, "86031", 2, 3, "Dr. STONE")
	if !ok {
		t.Fatal("expected ok")
	}
	if got.EmbedURL != "https://redeflixapi.bar/serie/86031/2/3" {
		t.Fatalf("embed = %q", got.EmbedURL)
	}
}

func TestBuildCatalogTarget_rejectsBadSeason(t *testing.T) {
	if _, ok := BuildCatalogTarget(ContentSerie, "86031", 0, 1, ""); ok {
		t.Fatal("expected reject")
	}
}

func TestEpisodesFromTemporadaValue_countAndList(t *testing.T) {
	t.Parallel()
	countRaw := json.RawMessage(`8`)
	eps, err := episodesFromTemporadaValue(countRaw)
	if err != nil || len(eps) != 8 || eps[7] != 8 {
		t.Fatalf("count shape: %v err=%v", eps, err)
	}
	listRaw := json.RawMessage(`[1,2,3,11]`)
	eps, err = episodesFromTemporadaValue(listRaw)
	if err != nil || len(eps) != 4 || eps[3] != 11 {
		t.Fatalf("list shape: %v err=%v", eps, err)
	}
}
