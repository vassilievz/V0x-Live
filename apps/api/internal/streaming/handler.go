package streaming

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"

	apiauth "github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/livekitauth"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
	"github.com/v0xlive/v0x-live/apps/api/internal/rooms"
)

type Handler struct {
	cfg   config.Config
	rooms *rooms.Service
}

func NewHandler(cfg config.Config, roomSvc *rooms.Service) *Handler {
	return &Handler{cfg: cfg, rooms: roomSvc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/{roomID}/livekit-token", h.livekitToken)
}

func (h *Handler) livekitToken(w http.ResponseWriter, r *http.Request) {
	sess, ok := apiauth.SessionFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Autenticação necessária")
		return
	}

	roomID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "roomID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}

	part, err := h.rooms.ActiveParticipant(r.Context(), roomID.Hex(), sess.ID)
	if err != nil {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Entre na sala primeiro")
		return
	}

	payload, err := livekitauth.MintParticipantToken(h.cfg, roomID, sess.ID, part)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao gerar token")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, payload)
}
