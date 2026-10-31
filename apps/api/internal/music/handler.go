package music

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
	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
	"github.com/v0xlive/v0x-live/apps/api/internal/rooms"
)

const (
	controlOwnerOnly = "owner_only"
	controlEveryone  = "everyone"
)

type Handler struct {
	music    *mongo.Collection
	messages *mongo.Collection
	rooms    *rooms.Service
	hub      *realtime.Hub
}

func NewHandler(store *database.Store, roomSvc *rooms.Service, hub *realtime.Hub) *Handler {
	return &Handler{
		music:    store.Collection("room_music"),
		messages: store.Collection("chat_messages"),
		rooms:    roomSvc,
		hub:      hub,
	}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/{roomID}/music", h.get)
	r.Post("/{roomID}/music", h.upsert)
	r.Patch("/{roomID}/music", h.patch)
	r.Delete("/{roomID}/music", h.remove)
}

type upsertRequest struct {
	URL         string `json:"url"`
	ControlMode string `json:"control_mode"`
	Title       string `json:"title"`
}

type patchRequest struct {
	Action       string  `json:"action"`
	PositionSec  float64 `json:"position_sec"`
	VideoID      string  `json:"video_id"`
	Title        string  `json:"title"`
	AuthorName   string  `json:"author_name"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Playing      *bool   `json:"playing"`
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	sess, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	_ = sess
	_ = part

	doc, err := h.findByRoom(r.Context(), roomID)
	if err == mongo.ErrNoDocuments {
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"active": false})
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar música")
		return
	}
	doc = h.enrichMetadata(r.Context(), doc)
	httpx.WriteJSON(w, http.StatusOK, h.toPayload(doc, true, part))
}

func (h *Handler) upsert(w http.ResponseWriter, r *http.Request) {
	sess, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}

	var req upsertRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}

	target, valid := ParseYouTubeURL(req.URL)
	if !valid {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Link do YouTube inválido")
		return
	}

	mode := strings.TrimSpace(req.ControlMode)
	if mode != controlEveryone {
		mode = controlOwnerOnly
	}

	sourceURL := strings.TrimSpace(req.URL)
	meta := ResolveYouTubeMetadata(r.Context(), target, sourceURL)

	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = meta.Title
	}
	if title == "" {
		title = "Vídeo do YouTube"
	}
	if len(title) > 200 {
		title = title[:200]
	}

	thumbnail := meta.ThumbnailURL
	if thumbnail == "" {
		thumbnail = FallbackThumbnail(target.VideoID)
	}

	author := meta.AuthorName
	if len(author) > 120 {
		author = author[:120]
	}

	now := time.Now().UTC()
	doc := models.RoomMusic{
		RoomID:              roomID,
		Platform:            "youtube",
		VideoID:             target.VideoID,
		PlaylistID:          target.PlaylistID,
		SourceURL:           sourceURL,
		Title:               title,
		AuthorName:          author,
		ThumbnailURL:        thumbnail,
		ControlMode:         mode,
		ControllerSessionID: sess.ID,
		AddedByName:         part.DisplayName,
		Playing:             false,
		PositionSec:         0,
		StateAt:             now,
		UpdatedAt:           now,
	}

	_, err := h.music.UpdateOne(
		r.Context(),
		bson.M{"room_id": roomID},
		bson.M{"$set": doc},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao salvar música")
		return
	}

	saved, err := h.findByRoom(r.Context(), roomID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar música")
		return
	}

	payload := h.toPayload(saved, true, part)
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventRoomMusicUpdated, payload)
	h.postSystemMessage(r.Context(), roomID, part.DisplayName+" adicionou \""+title+"\" do YouTube à sala.")

	httpx.WriteJSON(w, http.StatusCreated, h.toPayload(saved, true, part))
}

func (h *Handler) patch(w http.ResponseWriter, r *http.Request) {
	_, roomID, part, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}

	doc, err := h.findByRoom(r.Context(), roomID)
	if err == mongo.ErrNoDocuments {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhuma música ativa")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar música")
		return
	}

	if !canControlMusic(part, doc) {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Você não pode controlar esta faixa")
		return
	}

	var req patchRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}

	now := time.Now().UTC()
	action := strings.TrimSpace(req.Action)
	switch action {
	case "play":
		doc.Playing = true
		if req.PositionSec >= 0 {
			doc.PositionSec = req.PositionSec
		}
		doc.StateAt = now
	case "pause":
		doc.Playing = false
		if req.PositionSec >= 0 {
			doc.PositionSec = req.PositionSec
		}
		doc.StateAt = now
	case "seek":
		if req.PositionSec < 0 {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Posição inválida")
			return
		}
		doc.PositionSec = req.PositionSec
		doc.StateAt = now
	case "sync_track":
		videoID := strings.TrimSpace(req.VideoID)
		if videoID == "" {
			httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Vídeo inválido")
			return
		}
		doc.VideoID = videoID
		title := strings.TrimSpace(req.Title)
		author := strings.TrimSpace(req.AuthorName)
		thumb := strings.TrimSpace(req.ThumbnailURL)
		if title == "" || author == "" || thumb == "" {
			meta := ResolveYouTubeMetadata(
				r.Context(),
				YouTubeTarget{VideoID: videoID, PlaylistID: doc.PlaylistID},
				CanonicalYouTubeURL(YouTubeTarget{VideoID: videoID, PlaylistID: doc.PlaylistID}, doc.SourceURL),
			)
			if title == "" && meta.Title != "" {
				title = meta.Title
			}
			if author == "" && meta.AuthorName != "" {
				author = meta.AuthorName
			}
			if thumb == "" && meta.ThumbnailURL != "" {
				thumb = meta.ThumbnailURL
			}
		}
		if thumb == "" {
			thumb = FallbackThumbnail(videoID)
		} else if !validateHTTPSOnlyURL(thumb) {
			thumb = FallbackThumbnail(videoID)
		}
		if title == "" {
			title = "Vídeo do YouTube"
		}
		if len(title) > 200 {
			title = title[:200]
		}
		if len(author) > 120 {
			author = author[:120]
		}
		doc.Title = title
		doc.AuthorName = author
		doc.ThumbnailURL = thumb
		if req.PositionSec >= 0 {
			doc.PositionSec = req.PositionSec
		} else {
			doc.PositionSec = 0
		}
		if req.Playing != nil {
			doc.Playing = *req.Playing
		} else {
			doc.Playing = true
		}
		doc.StateAt = now
	default:
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Ação inválida")
		return
	}
	doc.UpdatedAt = now

	_, err = h.music.UpdateOne(r.Context(), bson.M{"room_id": roomID}, bson.M{"$set": doc})
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao atualizar reprodução")
		return
	}

	payload := h.toPayload(doc, true, part)
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventRoomMusicUpdated, payload)
	httpx.WriteJSON(w, http.StatusOK, payload)
}

func (h *Handler) remove(w http.ResponseWriter, r *http.Request) {
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
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar música")
		return
	}

	if !canControlMusic(part, doc) && part.Role != models.RoleHost {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Você não pode remover esta faixa")
		return
	}

	if _, err := h.music.DeleteOne(r.Context(), bson.M{"room_id": roomID}); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao remover música")
		return
	}

	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventRoomMusicUpdated, map[string]any{"active": false})
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"active": false})
}

func canControlMusic(part *models.RoomParticipant, doc *models.RoomMusic) bool {
	if doc.ControlMode == controlEveryone {
		return true
	}
	if part.SessionID == doc.ControllerSessionID {
		return true
	}
	return part.Role == models.RoleHost || part.Role == models.RoleModerator
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
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Entre na sala para usar música")
		return session.Session{}, primitive.NilObjectID, nil, false
	}
	return sess, roomID, &part, true
}

func (h *Handler) findByRoom(ctx context.Context, roomID primitive.ObjectID) (*models.RoomMusic, error) {
	var doc models.RoomMusic
	err := h.music.FindOne(ctx, bson.M{"room_id": roomID}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (h *Handler) enrichMetadata(ctx context.Context, doc *models.RoomMusic) *models.RoomMusic {
	needsTitle := doc.Title == "" || doc.Title == "Vídeo do YouTube" || doc.Title == "Playlist do YouTube"
	needsThumb := doc.ThumbnailURL == ""
	needsAuthor := doc.AuthorName == ""
	if !needsTitle && !needsThumb && !needsAuthor {
		return doc
	}

	meta := ResolveYouTubeMetadata(ctx, YouTubeTarget{
		VideoID:    doc.VideoID,
		PlaylistID: doc.PlaylistID,
	}, doc.SourceURL)

	updates := bson.M{}
	if needsTitle && meta.Title != "" && meta.Title != doc.Title {
		doc.Title = meta.Title
		updates["title"] = doc.Title
	}
	if needsAuthor && meta.AuthorName != "" {
		doc.AuthorName = meta.AuthorName
		updates["author_name"] = doc.AuthorName
	}
	if needsThumb {
		thumb := meta.ThumbnailURL
		if thumb == "" {
			thumb = FallbackThumbnail(doc.VideoID)
		}
		if thumb != "" {
			doc.ThumbnailURL = thumb
			updates["thumbnail_url"] = doc.ThumbnailURL
		}
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now().UTC()
		_, _ = h.music.UpdateOne(ctx, bson.M{"room_id": doc.RoomID}, bson.M{"$set": updates})
	}
	return doc
}

func (h *Handler) toPayload(doc *models.RoomMusic, active bool, part *models.RoomParticipant) map[string]any {
	canControl := false
	if part != nil {
		canControl = canControlMusic(part, doc)
	}
	return map[string]any{
		"active":                active,
		"platform":              doc.Platform,
		"video_id":              doc.VideoID,
		"playlist_id":           doc.PlaylistID,
		"source_url":            doc.SourceURL,
		"title":                 doc.Title,
		"author_name":           doc.AuthorName,
		"thumbnail_url":         doc.ThumbnailURL,
		"control_mode":          doc.ControlMode,
		"controller_session_id": doc.ControllerSessionID.Hex(),
		"added_by_name":         doc.AddedByName,
		"playing":               doc.Playing,
		"position_sec":          doc.PositionSec,
		"state_at":              doc.StateAt,
		"updated_at":            doc.UpdatedAt,
		"can_control":           canControl,
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
	payload := map[string]any{
		"id":                  msg.ID.Hex(),
		"body":                msg.Body,
		"sender_display_name": msg.SenderDisplayName,
		"created_at":          msg.CreatedAt,
		"kind":                "system",
	}
	h.hub.Publish(ctx, roomID.Hex(), realtime.EventChatMessage, payload)
}
