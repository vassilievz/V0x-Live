package chat

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
	"github.com/v0xlive/v0x-live/apps/api/internal/rooms"
)

const maxMessageRunes = 2000

type Handler struct {
	messages *mongo.Collection
	rooms    *rooms.Service
	hub      *realtime.Hub
}

func NewHandler(store *database.Store, roomSvc *rooms.Service, hub *realtime.Hub) *Handler {
	return &Handler{
		messages: store.Collection("chat_messages"),
		rooms:    roomSvc,
		hub:      hub,
	}
}

type postMessageRequest struct {
	Body string `json:"body"`
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/{roomID}/messages", h.list)
	r.Post("/{roomID}/messages", h.create)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Autenticação necessária")
		return
	}
	roomID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "roomID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	if _, err := h.rooms.ActiveParticipant(r.Context(), roomID.Hex(), sess.ID); err != nil {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Entre na sala para ver o chat")
		return
	}

	limit := int64(50)
	if q := r.URL.Query().Get("limit"); q != "" {
		if n, err := strconv.Atoi(q); err == nil && n > 0 && n <= 100 {
			limit = int64(n)
		}
	}

	cur, err := h.messages.Find(r.Context(), bson.M{"room_id": roomID},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(limit))
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar mensagens")
		return
	}
	defer cur.Close(r.Context())

	items := make([]map[string]any, 0)
	for cur.Next(r.Context()) {
		var msg models.ChatMessage
		if err := cur.Decode(&msg); err != nil {
			continue
		}
		items = append(items, map[string]any{
			"id":                  msg.ID.Hex(),
			"body":                msg.Body,
			"sender_display_name": msg.SenderDisplayName,
			"created_at":          msg.CreatedAt,
		})
	}

	httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
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
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Entre na sala para enviar mensagens")
		return
	}
	if part.Muted {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Você está silenciado")
		return
	}

	var req postMessageRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}

	body := Sanitize(strings.TrimSpace(req.Body))
	if body == "" || utf8.RuneCountInString(body) > maxMessageRunes {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Mensagem inválida")
		return
	}

	now := time.Now().UTC()
	msg := models.ChatMessage{
		RoomID:            roomID,
		SenderSessionID:   sess.ID,
		SenderDisplayName: part.DisplayName,
		Body:              body,
		CreatedAt:         now,
	}
	res, err := h.messages.InsertOne(r.Context(), msg)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao salvar mensagem")
		return
	}
	msg.ID, _ = res.InsertedID.(primitive.ObjectID)

	payload := map[string]any{
		"id":                  msg.ID.Hex(),
		"body":                msg.Body,
		"sender_display_name": msg.SenderDisplayName,
		"created_at":          msg.CreatedAt,
	}
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventChatMessage, payload)

	httpx.WriteJSON(w, http.StatusCreated, payload)
}

func Sanitize(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r == '<' || r == '>' {
			continue
		}
		b.WriteRune(r)
	}
	return strings.TrimSpace(b.String())
}
