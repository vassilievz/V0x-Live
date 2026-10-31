package music

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type YouTubeMetadata struct {
	Title        string
	AuthorName   string
	ThumbnailURL string
}

type oEmbedResponse struct {
	Title        string `json:"title"`
	AuthorName   string `json:"author_name"`
	ThumbnailURL string `json:"thumbnail_url"`
}

func CanonicalYouTubeURL(target YouTubeTarget, raw string) string {
	raw = strings.TrimSpace(raw)
	if target.VideoID != "" {
		link := url.URL{
			Scheme: "https",
			Host:   "www.youtube.com",
			Path:   "/watch",
		}
		q := link.Query()
		q.Set("v", target.VideoID)
		if target.PlaylistID != "" {
			q.Set("list", target.PlaylistID)
		}
		link.RawQuery = q.Encode()
		return link.String()
	}
	if target.PlaylistID != "" {
		return fmt.Sprintf("https://www.youtube.com/playlist?list=%s", url.QueryEscape(target.PlaylistID))
	}
	if strings.Contains(raw, "://") {
		return raw
	}
	return "https://" + raw
}

func FetchYouTubeMetadata(ctx context.Context, pageURL string) (YouTubeMetadata, error) {
	reqURL := "https://www.youtube.com/oembed?url=" + url.QueryEscape(pageURL) + "&format=json"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return YouTubeMetadata{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "V0xLive/1.0")

	client := &http.Client{Timeout: 8 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return YouTubeMetadata{}, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return YouTubeMetadata{}, fmt.Errorf("oembed status %d", res.StatusCode)
	}

	var payload oEmbedResponse
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return YouTubeMetadata{}, err
	}

	return YouTubeMetadata{
		Title:        strings.TrimSpace(payload.Title),
		AuthorName:   strings.TrimSpace(payload.AuthorName),
		ThumbnailURL: strings.TrimSpace(payload.ThumbnailURL),
	}, nil
}

func FallbackThumbnail(videoID string) string {
	if videoID == "" {
		return ""
	}
	return fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", videoID)
}

func validateHTTPSOnlyURL(raw string) bool {
	if raw == "" {
		return false
	}
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Host == "" {
		return false
	}
	return true
}

func ResolveYouTubeMetadata(ctx context.Context, target YouTubeTarget, rawURL string) YouTubeMetadata {
	pageURL := CanonicalYouTubeURL(target, rawURL)
	meta, err := FetchYouTubeMetadata(ctx, pageURL)
	if err == nil && meta.Title != "" {
		if meta.ThumbnailURL == "" {
			meta.ThumbnailURL = FallbackThumbnail(target.VideoID)
		}
		return meta
	}

	fallback := YouTubeMetadata{
		Title:        "Vídeo do YouTube",
		ThumbnailURL: FallbackThumbnail(target.VideoID),
	}
	if target.PlaylistID != "" && target.VideoID == "" {
		fallback.Title = "Playlist do YouTube"
	}
	return fallback
}
