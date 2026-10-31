package streaming

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/livekit/protocol/auth"
	"go.mongodb.org/mongo-driver/bson/primitive"

	apiauth "github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/config"
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

type tokenResponse struct {
	Token     string `json:"token"`
	URL       string `json:"url"`
	RoomName  string `json:"room_name"`
	Identity  string `json:"identity"`
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

	canPublish := part.CanPublish && !part.Muted
	roomName := roomID.Hex()
	identity := sess.ID.Hex()

	at := auth.NewAccessToken(h.cfg.LiveKitAPIKey, h.cfg.LiveKitAPISecret)
	canPub := canPublish
	canSub := true
	grant := &auth.VideoGrant{
		RoomJoin:     true,
		Room:         roomName,
		CanPublish:   &canPub,
		CanSubscribe: &canSub,
	}
	at.SetIdentity(identity).
		SetName(part.DisplayName).
		SetValidFor(15 * time.Minute).
		AddGrant(grant)

	jwt, err := at.ToJWT()
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao gerar token")
		return
	}

	httpx.WriteJSON(w, http.StatusOK, tokenResponse{
		Token:    jwt,
		URL:      h.cfg.LiveKitURL,
		RoomName: roomName,
		Identity: identity,
	})
}
