package auth

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

// ParticipantSync keeps room participant names aligned with guest profile updates.
type ParticipantSync interface {
	SyncDisplayNameForSession(ctx context.Context, sessionID primitive.ObjectID, displayName string) error
}

type Handler struct {
	sessions *session.Manager
	rooms    ParticipantSync
	users    *UserRepository
	cfg      config.Config
}

func NewHandler(sessions *session.Manager, rooms ParticipantSync, users *UserRepository, cfg config.Config) *Handler {
	return &Handler{sessions: sessions, rooms: rooms, users: users, cfg: cfg}
}

type guestRequest struct {
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
}

type patchGuestRequest struct {
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}

type userResponse struct {
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url,omitempty"`
	Email       string `json:"email,omitempty"`
	IsGuest     bool   `json:"is_guest"`
}

func (h *Handler) RegisterRoutes(r chi.Router, guestRateLimit func(http.Handler) http.Handler) {
	r.Post("/logout", h.logout)
	r.Get("/me", h.me)
	r.Patch("/me", h.patchMe)
	r.Get("/google", h.googleStart)
	r.Get("/google/callback", h.googleCallback)
	if guestRateLimit != nil {
		r.With(guestRateLimit).Post("/guest", h.guest)
	} else {
		r.Post("/guest", h.guest)
	}
}

func (h *Handler) guest(w http.ResponseWriter, r *http.Request) {
	var req guestRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		if !errors.Is(err, io.EOF) {
			httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
			return
		}
	}

	if existing, err := h.sessions.FromRequest(r.Context(), r); err == nil {
		if !existing.IsGuest && existing.UserID != nil {
			user, findErr := h.users.FindByID(r.Context(), *existing.UserID)
			if findErr != nil {
				httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
				return
			}
			h.writeUserResponse(
				w,
				user.DisplayName,
				NormalizeGuestAvatarURL(user.AvatarURL),
				user.Email,
				false,
			)
			return
		}
		if existing.IsGuest {
			mergedName, mergedAvatar := mergeGuestRequestWithSession(existing, req)
			name, avatar, errMsg := h.normalizeGuestProfile(mergedName, mergedAvatar)
			if errMsg != "" {
				httpx.WriteError(w, http.StatusBadRequest, "validation_error", errMsg)
				return
			}
			if name != existing.GuestDisplayName || avatar != existing.GuestAvatarURL {
				if err := h.persistGuestProfile(r.Context(), existing.ID, name, avatar); err != nil {
					httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao atualizar sessão")
					return
				}
			}
			h.writeUser(w, name, avatar)
			return
		}
	}

	name, avatar, errMsg := h.normalizeGuestProfile(req.DisplayName, req.AvatarURL)
	if errMsg != "" {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", errMsg)
		return
	}

	token, _, err := h.sessions.CreateGuest(r.Context(), name, avatar)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao criar sessão")
		return
	}
	h.sessions.SetCookie(w, token)

	httpx.WriteJSON(w, http.StatusCreated, userResponse{
		DisplayName: name,
		AvatarURL:   avatar,
		IsGuest:     true,
	})
}

func mergeGuestRequestWithSession(existing session.Session, req guestRequest) (string, string) {
	name := existing.GuestDisplayName
	if name == "" {
		name = DefaultGuestDisplayName
	}
	avatar := existing.GuestAvatarURL
	trimmedName := strings.TrimSpace(req.DisplayName)
	if trimmedName != "" && !strings.EqualFold(trimmedName, DefaultGuestDisplayName) {
		name = trimmedName
	}
	if strings.TrimSpace(req.AvatarURL) != "" {
		avatar = strings.TrimSpace(req.AvatarURL)
	}
	return name, avatar
}

func (h *Handler) persistGuestProfile(ctx context.Context, sessionID primitive.ObjectID, name, avatar string) error {
	if err := h.sessions.UpdateGuest(ctx, sessionID, name, avatar); err != nil {
		return err
	}
	if h.rooms != nil {
		_ = h.rooms.SyncDisplayNameForSession(ctx, sessionID, name)
	}
	return nil
}

func (h *Handler) patchMe(w http.ResponseWriter, r *http.Request) {
	sess, err := h.sessions.FromRequest(r.Context(), r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
		return
	}

	var req patchGuestRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}
	if req.DisplayName == nil && req.AvatarURL == nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Nenhum campo para atualizar")
		return
	}

	if !sess.IsGuest {
		if sess.UserID == nil {
			httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
			return
		}
		user, err := h.users.FindByID(r.Context(), *sess.UserID)
		if err != nil {
			httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
			return
		}
		name := user.DisplayName
		avatar := user.AvatarURL
		if req.DisplayName != nil {
			name = strings.TrimSpace(*req.DisplayName)
		}
		if req.AvatarURL != nil {
			avatar = strings.TrimSpace(*req.AvatarURL)
		}
		name, avatar, errMsg := h.normalizeGuestProfile(name, avatar)
		if errMsg != "" {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", errMsg)
			return
		}
		if err := h.users.UpdateProfile(r.Context(), user.ID, name, avatar); err != nil {
			httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao atualizar perfil")
			return
		}
		if h.rooms != nil {
			_ = h.rooms.SyncDisplayNameForSession(r.Context(), sess.ID, name)
		}
		h.writeUserResponse(w, name, avatar, user.Email, false)
		return
	}

	name := sess.GuestDisplayName
	avatar := sess.GuestAvatarURL
	if req.DisplayName != nil {
		name = strings.TrimSpace(*req.DisplayName)
	}
	if req.AvatarURL != nil {
		avatar = strings.TrimSpace(*req.AvatarURL)
	}

	name, avatar, errMsg := h.normalizeGuestProfile(name, avatar)
	if errMsg != "" {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", errMsg)
		return
	}

	if err := h.persistGuestProfile(r.Context(), sess.ID, name, avatar); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao atualizar sessão")
		return
	}

	h.writeUser(w, name, avatar)
}

func (h *Handler) normalizeGuestProfile(displayName, avatarURL string) (string, string, string) {
	name := NormalizeGuestDisplayName(displayName)
	if !ValidateGuestDisplayName(name) {
		return "", "", "Nome deve ter entre 2 e 64 caracteres"
	}
	if IsReservedDisplayName(name) {
		return "", "", "Nome de exibição reservado"
	}
	avatar := NormalizeGuestAvatarURL(avatarURL)
	if !ValidateGuestAvatarURL(avatar) {
		return "", "", "Use um link http ou https válido para a foto"
	}
	return name, avatar, ""
}

func (h *Handler) writeUserResponse(w http.ResponseWriter, name, avatar, email string, isGuest bool) {
	httpx.WriteJSON(w, http.StatusOK, userResponse{
		DisplayName: name,
		AvatarURL:   avatar,
		Email:       email,
		IsGuest:     isGuest,
	})
}

func (h *Handler) writeUser(w http.ResponseWriter, name, avatar string) {
	h.writeUserResponse(w, name, avatar, "", true)
}

func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(h.sessions.CookieName())
	if err == nil {
		_ = h.sessions.Revoke(r.Context(), cookie.Value)
	}
	h.sessions.ClearCookie(w)
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) me(w http.ResponseWriter, r *http.Request) {
	sess, err := h.sessions.FromRequest(r.Context(), r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
		return
	}

	if !sess.IsGuest {
		if sess.UserID == nil {
			httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
			return
		}
		user, err := h.users.FindByID(r.Context(), *sess.UserID)
		if err != nil {
			httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida ou expirada")
			return
		}
		h.writeUserResponse(w, user.DisplayName, NormalizeGuestAvatarURL(user.AvatarURL), user.Email, false)
		return
	}

	name := sess.GuestDisplayName
	if name == "" {
		name = DefaultGuestDisplayName
	}

	h.writeUser(w, name, NormalizeGuestAvatarURL(sess.GuestAvatarURL))
}

func RequireSession(sessions *session.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sess, err := sessions.FromRequest(r.Context(), r)
			if err != nil {
				httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Autenticação necessária")
				return
			}
			ctx := context.WithValue(r.Context(), sessionContextKey{}, sess)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

type sessionContextKey struct{}

func SessionFromContext(ctx context.Context) (session.Session, bool) {
	s, ok := ctx.Value(sessionContextKey{}).(session.Session)
	return s, ok
}
