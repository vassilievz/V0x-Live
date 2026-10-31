package music

import (
	"net/url"
	"strings"
	"testing"
)

func TestAllowedStreamURL_sameHost(t *testing.T) {
	anchor := "https://cdn.example.com/live/main.m3u8?token=abc"
	seg := "https://cdn.example.com/live/seg001.ts"
	if _, ok := AllowedStreamURL(anchor, seg); !ok {
		t.Fatal("expected same host segment allowed")
	}
}

func TestAllowedStreamURL_subdomain(t *testing.T) {
	anchor := "https://x9k4.example.com/s/105248/stream.m3u8?uid=1"
	seg := "https://seg.x9k4.example.com/s/105248/part.ts"
	if _, ok := AllowedStreamURL(anchor, seg); !ok {
		t.Fatal("expected subdomain segment allowed")
	}
}

func TestAllowedStreamURL_rejectsForeignHost(t *testing.T) {
	anchor := "https://cdn.example.com/v.m3u8"
	foreign := "https://evil.example.org/seg.ts"
	if _, ok := AllowedStreamURL(anchor, foreign); ok {
		t.Fatal("expected foreign host rejected")
	}
}

func TestRewriteHLSManifest_rewritesSegments(t *testing.T) {
	manifestRaw := "https://cdn.example.com/path/index.m3u8?sig=1"
	manifestURL, _ := url.Parse(manifestRaw)
	body := []byte("#EXTM3U\n#EXTINF:6.0,\nsegment0.ts\nhttps://cdn.example.com/path/segment1.ts\n")
	out, err := rewriteHLSManifest(manifestURL, manifestRaw, body, func(abs string) string {
		return "/proxy?url=" + abs
	})
	if err != nil {
		t.Fatal(err)
	}
	text := string(out)
	if !strings.Contains(text, "/proxy?url=https://cdn.example.com/path/segment0.ts") {
		t.Fatalf("expected relative segment rewritten, got %q", text)
	}
	if !strings.Contains(text, "/proxy?url=") {
		t.Fatalf("expected proxy urls, got %q", text)
	}
}
