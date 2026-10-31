package music

import (
	"net/url"
	"strings"
)

const MaxDirectMediaURLLen = 2048

type DirectMediaTarget struct {
	SourceURL string
	MediaType string // mp4 | hls
}

// ParseDirectMediaURL validates HTTPS direct video URLs (.mp4 / .m3u8 on path only).
// The server never fetches the URL (SSRF-safe); it only stores and broadcasts metadata.
func ParseDirectMediaURL(raw string) (DirectMediaTarget, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" || len(raw) > MaxDirectMediaURLLen {
		return DirectMediaTarget{}, false
	}

	u, err := url.Parse(raw)
	if err != nil {
		return DirectMediaTarget{}, false
	}
	if u.Scheme != "https" || u.Host == "" {
		return DirectMediaTarget{}, false
	}
	if u.User != nil {
		return DirectMediaTarget{}, false
	}

	path := strings.ToLower(u.EscapedPath())
	if path == "" {
		path = strings.ToLower(u.Path)
	}

	switch {
	case strings.HasSuffix(path, ".mp4"):
		return DirectMediaTarget{SourceURL: raw, MediaType: "mp4"}, true
	case strings.HasSuffix(path, ".m3u8"):
		return DirectMediaTarget{SourceURL: raw, MediaType: "hls"}, true
	default:
		return DirectMediaTarget{}, false
	}
}

func directMediaTitleFromPath(raw string) string {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return "Vídeo direto"
	}
	base := u.Path
	if idx := strings.LastIndex(base, "/"); idx >= 0 {
		base = base[idx+1:]
	}
	if base == "" {
		return "Vídeo direto"
	}
	if len(base) > 120 {
		base = base[:120]
	}
	return base
}
