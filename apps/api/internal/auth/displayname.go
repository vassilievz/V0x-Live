package auth

import (
	"net/url"
	"strings"
)

const DefaultGuestDisplayName = "Guest"

// DefaultGuestAvatarPath is served by the web app (apps/web/public/media).
const DefaultGuestAvatarPath = "/media/default-guest-avatar.gif"

var reservedDisplayNames = map[string]struct{}{
	"v0x live": {},
	"system":   {},
}

func IsReservedDisplayName(name string) bool {
	_, ok := reservedDisplayNames[strings.ToLower(strings.TrimSpace(name))]
	return ok
}

func ValidateGuestDisplayName(name string) bool {
	name = strings.TrimSpace(name)
	n := len(name)
	return n >= 2 && n <= 64
}

func ValidateGuestAvatarURL(raw string) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return true
	}
	if len(raw) > 2048 {
		return false
	}
	if strings.HasPrefix(raw, "/media/") && !strings.Contains(raw, "..") {
		return true
	}
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}
	return u.Host != ""
}

func NormalizeGuestDisplayName(raw string) string {
	name := strings.TrimSpace(raw)
	if name == "" {
		return DefaultGuestDisplayName
	}
	return name
}

func NormalizeGuestAvatarURL(raw string) string {
	avatar := strings.TrimSpace(raw)
	if avatar == "" {
		return DefaultGuestAvatarPath
	}
	return avatar
}
