package health

import (
	"context"
	"net/http"
	"time"

	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type Handler struct {
	store   *database.Store
	version string
}

func NewHandler(store *database.Store, version string) *Handler {
	return &Handler{store: store, version: version}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": h.version,
	})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	if err := h.store.Client.Ping(ctx, readpref.Primary()); err != nil {
		httpx.WriteJSON(w, http.StatusServiceUnavailable, map[string]any{"ready": false, "mongo": false})
		return
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]any{"ready": true})
}
