package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

const oauthStateCookie = "v0x_oauth_state"

type googleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (h *Handler) oauthConfig() (*oauth2.Config, bool) {
	if !h.cfg.GoogleOAuthEnabled() {
		return nil, false
	}
	return &oauth2.Config{
		ClientID:     h.cfg.GoogleClientID,
		ClientSecret: h.cfg.GoogleClientSecret,
		RedirectURL:  h.cfg.GoogleRedirectURI,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}, true
}

func (h *Handler) googleStart(w http.ResponseWriter, r *http.Request) {
	cfg, ok := h.oauthConfig()
	if !ok {
		httpx.WriteError(w, http.StatusServiceUnavailable, "oauth_unavailable", "Login Google não configurado")
		return
	}
	state, err := randomOAuthState()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao iniciar login")
		return
	}
	h.setOAuthStateCookie(w, state)
	http.Redirect(w, r, cfg.AuthCodeURL(state, oauth2.AccessTypeOnline), http.StatusFound)
}

func (h *Handler) googleCallback(w http.ResponseWriter, r *http.Request) {
	cfg, ok := h.oauthConfig()
	if !ok {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=unavailable", http.StatusFound)
		return
	}
	if errParam := strings.TrimSpace(r.URL.Query().Get("error")); errParam != "" {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=cancelled", http.StatusFound)
		return
	}
	state := strings.TrimSpace(r.URL.Query().Get("state"))
	if !h.validateOAuthState(r, state) {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=invalid", http.StatusFound)
		return
	}
	h.clearOAuthStateCookie(w)

	code := strings.TrimSpace(r.URL.Query().Get("code"))
	if code == "" {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=invalid", http.StatusFound)
		return
	}

	ctx := r.Context()
	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=failed", http.StatusFound)
		return
	}
	info, err := fetchGoogleUserInfo(ctx, token.AccessToken)
	if err != nil || info.ID == "" {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=failed", http.StatusFound)
		return
	}

	user, err := h.users.UpsertGoogleUser(ctx, GoogleProfile{
		ID:        info.ID,
		Email:     info.Email,
		Name:      info.Name,
		AvatarURL: info.Picture,
	})
	if err != nil {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=failed", http.StatusFound)
		return
	}

	if cookie, err := r.Cookie(h.sessions.CookieName()); err == nil {
		_ = h.sessions.Revoke(ctx, cookie.Value)
	}

	rawToken, _, err := h.sessions.CreateForUser(ctx, user.ID)
	if err != nil {
		http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=failed", http.StatusFound)
		return
	}
	h.sessions.SetCookie(w, rawToken)
	http.Redirect(w, r, h.cfg.AppPublicURL+"/dashboard?auth=google", http.StatusFound)
}

func fetchGoogleUserInfo(ctx context.Context, accessToken string) (googleUserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return googleUserInfo{}, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return googleUserInfo{}, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return googleUserInfo{}, fmt.Errorf("google userinfo: %s", res.Status)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return googleUserInfo{}, err
	}
	var info googleUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return googleUserInfo{}, err
	}
	return info, nil
}

func randomOAuthState() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func (h *Handler) setOAuthStateCookie(w http.ResponseWriter, state string) {
	sameSite := http.SameSiteLaxMode
	if h.cfg.SecureCookies() {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookie,
		Value:    state,
		Path:     "/",
		MaxAge:   600,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   h.cfg.SecureCookies(),
	})
}

func (h *Handler) clearOAuthStateCookie(w http.ResponseWriter) {
	sameSite := http.SameSiteLaxMode
	if h.cfg.SecureCookies() {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   h.cfg.SecureCookies(),
	})
}

func (h *Handler) validateOAuthState(r *http.Request, state string) bool {
	if state == "" {
		return false
	}
	cookie, err := r.Cookie(oauthStateCookie)
	if err != nil {
		return false
	}
	return cookie.Value == state
}
