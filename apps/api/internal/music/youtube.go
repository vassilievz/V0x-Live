package music

import (
	"net/url"
	"strings"
)

type YouTubeTarget struct {
	VideoID    string
	PlaylistID string
}

func ParseYouTubeURL(raw string) (YouTubeTarget, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return YouTubeTarget{}, false
	}
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil {
		return YouTubeTarget{}, false
	}
	host := strings.ToLower(strings.TrimPrefix(u.Host, "www."))
	if host != "youtube.com" && host != "m.youtube.com" && host != "youtu.be" && host != "music.youtube.com" {
		return YouTubeTarget{}, false
	}

	q := u.Query()
	target := YouTubeTarget{}

	if host == "youtu.be" {
		id := strings.Trim(strings.TrimPrefix(u.Path, "/"), "/")
		if id != "" {
			target.VideoID = id
		}
	} else {
		switch {
		case q.Get("v") != "":
			target.VideoID = q.Get("v")
		case strings.HasPrefix(u.Path, "/watch"):
			target.VideoID = q.Get("v")
		case strings.HasPrefix(u.Path, "/shorts/"):
			target.VideoID = strings.TrimPrefix(u.Path, "/shorts/")
			target.VideoID = strings.Split(target.VideoID, "/")[0]
		case strings.HasPrefix(u.Path, "/embed/"):
			target.VideoID = strings.TrimPrefix(u.Path, "/embed/")
			target.VideoID = strings.Split(target.VideoID, "/")[0]
		}
		if list := q.Get("list"); list != "" {
			target.PlaylistID = list
		}
		if strings.HasPrefix(u.Path, "/playlist") && target.PlaylistID == "" {
			target.PlaylistID = q.Get("list")
		}
	}

	if target.VideoID == "" && target.PlaylistID == "" {
		return YouTubeTarget{}, false
	}
	return target, true
}
