package music

import (
	"strings"
	"testing"
)

func TestParseDirectMediaURL_acceptsPresignedMP4(t *testing.T) {
	raw := "https://bucket.r2.cloudflarestorage.com/path/movie.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=x&X-Amz-Signature=abc"
	got, ok := ParseDirectMediaURL(raw)
	if !ok {
		t.Fatal("expected valid presigned mp4 url")
	}
	if got.MediaType != "mp4" {
		t.Fatalf("mediaType = %q, want mp4", got.MediaType)
	}
	if got.SourceURL != raw {
		t.Fatalf("sourceURL changed: %q", got.SourceURL)
	}
}

func TestParseDirectMediaURL_acceptsM3U8WithQuery(t *testing.T) {
	raw := "https://cdn.example.com/live/stream.m3u8?token=longvalue"
	got, ok := ParseDirectMediaURL(raw)
	if !ok {
		t.Fatal("expected valid m3u8 url")
	}
	if got.MediaType != "hls" {
		t.Fatalf("mediaType = %q, want hls", got.MediaType)
	}
}

func TestParseDirectMediaURL_rejectsNonHTTPS(t *testing.T) {
	cases := []string{
		"",
		"http://cdn.example.com/v.mp4",
		"javascript:alert(1)",
		"data:text/plain,hello",
		"file:///etc/passwd",
		"https://cdn.example.com/video.mov",
		"https://cdn.example.com/stream?file=clip.mp4",
	}
	for _, raw := range cases {
		if _, ok := ParseDirectMediaURL(raw); ok {
			t.Fatalf("expected reject for %q", raw)
		}
	}
}

func TestParseDirectMediaURL_rejectsOversized(t *testing.T) {
	raw := "https://cdn.example.com/v.mp4?" + strings.Repeat("a", MaxDirectMediaURLLen)
	if _, ok := ParseDirectMediaURL(raw); ok {
		t.Fatal("expected reject for oversized url")
	}
}
