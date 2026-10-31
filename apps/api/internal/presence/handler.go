package presence

import (
	"net/http"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

type Handler struct {
	store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

type onlineResponse struct {
	Online int `json:"online"`
}

func (h *Handler) Heartbeat(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Autenticação necessária")
		return
	}
	h.store.Touch(sess.ID.Hex())
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) OnlineCount(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, onlineResponse{Online: h.store.Count()})
}
