package realtime

import (
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

type Handler struct {
	hub      *Hub
	sessions *session.Manager
	rooms    RoomAccess
	cfg      config.Config
	upgrader websocket.Upgrader
}

func NewHandler(hub *Hub, sessions *session.Manager, rooms RoomAccess, cfg config.Config) *Handler {
	return &Handler{
		hub:      hub,
		sessions: sessions,
		rooms:    rooms,
		cfg:      cfg,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				if origin == "" {
					return !cfg.SecureCookies()
				}
				for _, allowed := range cfg.CORSAllowedOrigins {
					if origin == allowed {
						return true
					}
				}
				return false
			},
		},
	}
}

func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room_id")
	if roomID == "" {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "room_id obrigatório")
		return
	}

	sess, err := h.sessions.FromRequest(r.Context(), r)
	if err != nil {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Sessão inválida")
		return
	}

	if err := h.rooms.EnsureActiveParticipant(r.Context(), roomID, sess.ID); err != nil {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Entre na sala antes de conectar ao tempo real")
		return
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := NewClient(h.hub, roomID, sess.ID, conn)
	client.Run(r.Context())
}
