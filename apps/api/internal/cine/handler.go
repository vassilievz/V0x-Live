package cine

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
	"github.com/v0xlive/v0x-live/apps/api/internal/music"
	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
	"github.com/v0xlive/v0x-live/apps/api/internal/rooms"
)

type Handler struct {
	cine       *mongo.Collection
	messages   *mongo.Collection
	rooms      *rooms.Service
	hub        *realtime.Hub
	catalogSvc *CatalogService
}

func NewHandler(store *database.Store, roomSvc *rooms.Service, hub *realtime.Hub, catalogSvc *CatalogService) *Handler {
	if catalogSvc == nil {
		catalogSvc = NewCatalogService()
	}
	return &Handler{
		cine:       store.Collection("room_cine"),
		messages:   store.Collection("chat_messages"),
		rooms:      roomSvc,
		hub:        hub,
		catalogSvc: catalogSvc,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/{roomID}/cine/stream/resource", h.streamResource)
	r.Get("/{roomID}/cine/stream", h.stream)
	r.Get("/{roomID}/cine", h.get)
	r.Post("/{roomID}/cine", h.upsert)
	r.Patch("/{roomID}/cine", h.patch)
	r.Delete("/{roomID}/cine", h.stop)
}

type upsertBody struct {
	Mode        string  `json:"mode"`
	ContentType string  `json:"content_type"`
	MediaID     string  `json:"media_id"`
	Season      int     `json:"season"`
	Episode     int     `json:"episode"`
	Title       string  `json:"title"`
	URL         string  `json:"url"`
}

type patchBody struct {
	Action      string  `json:"action"`
	PositionSec float64 `json:"position_sec"`
	Season      int     `json:"season"`
	Episode     int     `json:"episode"`
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	_, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	doc, err := h.findByRoom(r.Context(), roomID)
	if err == mongo.ErrNoDocuments {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"active": false})
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar Cine")
		return
	}
	if !cineHasPlayback(*doc) {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"active": false})
		return
	}
	httpx.WriteJSON(w, http.StatusOK, h.toPayload(r.Context(), doc, part))
}

func (h *Handler) upsert(w http.ResponseWriter, r *http.Request) {
	sess, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	if !isRoomHostOwner(r.Context(), h.rooms, roomID, part) {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Somente o dono da sala controla o Cine")
		return
	}

	var req upsertBody
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}

	mode := strings.TrimSpace(req.Mode)
	now := time.Now().UTC()
	doc := models.RoomCine{
		RoomID:        roomID,
		HostSessionID: sess.ID,
		HostName:      part.DisplayName,
		UpdatedAt:     now,
		StateAt:       now,
	}

	switch mode {
	case ModeCatalog:
		mediaID, err := h.catalogSvc.ResolvePlaybackMediaID(r.Context(), req.ContentType, req.MediaID)
		if err != nil || mediaID == "" {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Use ID TMDB numérico ou IMDb válido (tt…) para resolver o player RedeFlix")
			return
		}
		target, valid := BuildCatalogTarget(req.ContentType, mediaID, req.Season, req.Episode, req.Title)
		if !valid {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Catálogo inválido")
			return
		}
		doc.Mode = ModeCatalog
		doc.ContentType = target.ContentType
		doc.MediaID = target.MediaID
		doc.Season = target.Season
		doc.Episode = target.Episode
		doc.EmbedURL = target.EmbedURL
		doc.Title = target.Title
		doc.Playing = false
		doc.PositionSec = 0
	case ModeDirect:
		direct, valid := music.ParseDirectMediaURL(req.URL)
		if !valid {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Use HTTPS com path .mp4 ou .m3u8")
			return
		}
		doc.Mode = ModeDirect
		doc.SourceURL = direct.SourceURL
		doc.MediaType = direct.MediaType
		doc.Title = strings.TrimSpace(req.Title)
		if doc.Title == "" {
			doc.Title = "Vídeo direto"
		}
		doc.Playing = true
		doc.PositionSec = 0
	default:
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Modo inválido")
		return
	}

	if _, err := h.cine.UpdateOne(
		r.Context(),
		bson.M{"room_id": roomID},
		bson.M{"$set": doc},
		options.Update().SetUpsert(true),
	); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao salvar Cine")
		return
	}

	saved, err := h.findByRoom(r.Context(), roomID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar Cine")
		return
	}
	payload := h.toPayload(r.Context(), saved, part)
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventRoomCineUpdated, payload)
	h.postSystemMessage(r.Context(), roomID, part.DisplayName+" iniciou uma sessão Cine.")
	httpx.WriteJSON(w, http.StatusCreated, payload)
}

func (h *Handler) patch(w http.ResponseWriter, r *http.Request) {
	_, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	if !isRoomHostOwner(r.Context(), h.rooms, roomID, part) {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Somente o dono da sala controla o Cine")
		return
	}

	doc, err := h.findByRoom(r.Context(), roomID)
	if err == mongo.ErrNoDocuments {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhuma sessão Cine ativa")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar Cine")
		return
	}

	var req patchBody
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}

	now := time.Now().UTC()
	action := strings.TrimSpace(req.Action)

	switch action {
	case "play":
		if doc.Mode != ModeDirect {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Play sincronizado só no modo link direto")
			return
		}
		doc.Playing = true
		if req.PositionSec >= 0 {
			doc.PositionSec = req.PositionSec
		}
		doc.StateAt = now
	case "pause":
		if doc.Mode != ModeDirect {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Pause sincronizado só no modo link direto")
			return
		}
		doc.Playing = false
		if req.PositionSec >= 0 {
			doc.PositionSec = req.PositionSec
		}
		doc.StateAt = now
	case "seek":
		if doc.Mode != ModeDirect {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Seek só no modo link direto")
			return
		}
		if req.PositionSec < 0 {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Posição inválida")
			return
		}
		doc.PositionSec = req.PositionSec
		doc.StateAt = now
	case "sync":
		if doc.Mode != ModeDirect {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Sync só no modo link direto")
			return
		}
		if !doc.Playing {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Sync só com reprodução ativa")
			return
		}
		if req.PositionSec < 0 {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Posição inválida")
			return
		}
		doc.PositionSec = req.PositionSec
		doc.StateAt = now
	case "prev_episode", "next_episode", "set_episode":
		if doc.Mode != ModeCatalog || doc.ContentType != ContentSerie {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Episódios só no modo série")
			return
		}
		season := doc.Season
		episode := doc.Episode
		switch action {
		case "prev_episode":
			if episode > 1 {
				episode--
			}
		case "next_episode":
			episode++
		case "set_episode":
			if req.Season >= 1 {
				season = req.Season
			}
			if req.Episode >= 1 {
				episode = req.Episode
			}
		}
		target, valid := BuildCatalogTarget(ContentSerie, doc.MediaID, season, episode, doc.Title)
		if !valid {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Episódio inválido")
			return
		}
		doc.Season = target.Season
		doc.Episode = target.Episode
		doc.EmbedURL = target.EmbedURL
		doc.Title = target.Title
		doc.Playing = false
		doc.PositionSec = 0
		doc.StateAt = now
	default:
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Ação inválida")
		return
	}

	doc.UpdatedAt = now
	if _, err := h.cine.UpdateOne(r.Context(), bson.M{"room_id": roomID}, bson.M{"$set": doc}); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao atualizar Cine")
		return
	}

	payload := h.toPayload(r.Context(), doc, part)
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventRoomCineUpdated, payload)
	httpx.WriteJSON(w, http.StatusOK, payload)
}

func (h *Handler) stop(w http.ResponseWriter, r *http.Request) {
	_, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	if !isRoomHostOwner(r.Context(), h.rooms, roomID, part) {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Somente o dono da sala controla o Cine")
		return
	}

	if _, err := h.cine.DeleteOne(r.Context(), bson.M{"room_id": roomID}); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao encerrar Cine")
		return
	}

	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventRoomCineUpdated, map[string]any{"active": false})
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"active": false})
}

func (h *Handler) roomParticipant(
	w http.ResponseWriter,
	r *http.Request,
) (session.Session, primitive.ObjectID, *models.RoomParticipant, bool) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Autenticação necessária")
		return session.Session{}, primitive.NilObjectID, nil, false
	}
	roomID, err := primitive.ObjectIDFromHex(chi.URLParam(r, "roomID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return session.Session{}, primitive.NilObjectID, nil, false
	}
	part, err := h.rooms.ActiveParticipant(r.Context(), roomID.Hex(), sess.ID)
	if err != nil {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Entre na sala para usar o Cine")
		return session.Session{}, primitive.NilObjectID, nil, false
	}
	return sess, roomID, &part, true
}

func (h *Handler) findByRoom(ctx context.Context, roomID primitive.ObjectID) (*models.RoomCine, error) {
	var doc models.RoomCine
	err := h.cine.FindOne(ctx, bson.M{"room_id": roomID}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (h *Handler) toPayload(ctx context.Context, doc *models.RoomCine, part *models.RoomParticipant) map[string]any {
	isHost := isRoomHostOwner(ctx, h.rooms, doc.RoomID, part)
	return map[string]any{
		"active":       true,
		"mode":         doc.Mode,
		"content_type": doc.ContentType,
		"media_id":     doc.MediaID,
		"season":       doc.Season,
		"episode":      doc.Episode,
		"embed_url":    doc.EmbedURL,
		"source_url":   doc.SourceURL,
		"media_type":   doc.MediaType,
		"title":        doc.Title,
		"host_name":    doc.HostName,
		"playing":      doc.Playing,
		"position_sec": doc.PositionSec,
		"state_at":     doc.StateAt,
		"updated_at":   doc.UpdatedAt,
		"is_host":      isHost,
		"can_control":  isHost,
	}
}

func (h *Handler) postSystemMessage(ctx context.Context, roomID primitive.ObjectID, body string) {
	now := time.Now().UTC()
	msg := models.ChatMessage{
		RoomID:            roomID,
		SenderSessionID:   primitive.NilObjectID,
		SenderDisplayName: "V0x Live",
		Body:              body,
		CreatedAt:         now,
	}
	res, err := h.messages.InsertOne(ctx, msg)
	if err != nil {
		return
	}
	msg.ID, _ = res.InsertedID.(primitive.ObjectID)
	h.hub.Publish(ctx, roomID.Hex(), realtime.EventChatMessage, map[string]any{
		"id":                  msg.ID.Hex(),
		"body":                msg.Body,
		"sender_display_name": msg.SenderDisplayName,
		"created_at":          msg.CreatedAt,
		"kind":                "system",
	})
}

func cineHasPlayback(doc models.RoomCine) bool {
	switch doc.Mode {
	case ModeCatalog:
		return strings.TrimSpace(doc.EmbedURL) != ""
	case ModeDirect:
		return strings.TrimSpace(doc.SourceURL) != ""
	default:
		return false
	}
}
