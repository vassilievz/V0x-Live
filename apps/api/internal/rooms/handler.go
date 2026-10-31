package rooms

import (
	"context"
	"encoding/base64"
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
	"github.com/v0xlive/v0x-live/apps/api/internal/livekitauth"
)

type Handler struct {
	svc *Service
	hub *realtime.Hub
	cfg config.Config
}

func NewHandler(svc *Service, hub *realtime.Hub, cfg config.Config) *Handler {
	return &Handler{svc: svc, hub: hub, cfg: cfg}
}

type listResponse struct {
	Items []publicRoomItem `json:"items"`
	Total int              `json:"total"`
}

type publicRoomItem struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	Description      string `json:"description,omitempty"`
	ParticipantCount int    `json:"participant_count"`
	IsLive           bool   `json:"is_live"`
	HasPreview       bool   `json:"has_preview"`
}

type createRequest struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Visibility      string `json:"visibility"`
	Password        string `json:"password"`
	MaxParticipants int    `json:"max_participants"`
}

type joinRequest struct {
	Password string `json:"password"`
}

type joinByCodeRequest struct {
	Code     string `json:"code"`
	Password string `json:"password"`
}

type permissionRequest struct {
	CanPublish *bool   `json:"can_publish"`
	Muted      *bool   `json:"muted"`
	Role       *string `json:"role"`
}

func (h *Handler) RegisterPublic(r chi.Router) {
	r.Get("/", h.listPublic)
	r.Get("/{roomID}/preview", h.previewRoom)
	r.Get("/{roomID}/cover", h.roomCover)
}

func (h *Handler) RegisterProtected(r chi.Router) {
	r.Get("/mine", h.listMine)
	r.Post("/", h.create)
	r.Post("/join-by-code", h.joinByCode)
	r.Get("/{roomID}", h.getRoom)
	r.Get("/{roomID}/entry", h.entryRoom)
	r.Post("/{roomID}/join", h.join)
	r.Post("/{roomID}/leave", h.leave)
	r.Delete("/{roomID}", h.closeRoom)
	r.Get("/{roomID}/participants", h.listParticipants)
	r.Delete("/{roomID}/participants/{participantID}", h.removeParticipant)
	r.Patch("/{roomID}/participants/{participantID}/permissions", h.patchPermissions)
	r.Post("/{roomID}/screen", h.screenSignal)
	r.Put("/{roomID}/cover", h.uploadRoomCover)
}

func (h *Handler) listPublic(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.ListPublic(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao listar salas")
		return
	}
	out := make([]publicRoomItem, len(items))
	for i, it := range items {
		out[i] = publicRoomItem{
			ID:               it.ID,
			Name:             it.Name,
			Description:      it.Description,
			ParticipantCount: it.ParticipantCount,
			IsLive:           it.IsLive,
			HasPreview:       it.HasPreview,
		}
	}
	httpx.WriteJSON(w, http.StatusOK, listResponse{Items: out, Total: len(out)})
}

func (h *Handler) listMine(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok || sess.IsGuest || sess.UserID == nil {
		httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Conta Google necessária")
		return
	}
	items, err := h.svc.ListOwnedByUser(r.Context(), *sess.UserID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao listar salas")
		return
	}
	type mineItem struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Visibility string `json:"visibility"`
		InviteCode string `json:"invite_code"`
	}
	out := make([]mineItem, len(items))
	for i, it := range items {
		out[i] = mineItem{
			ID:         it.ID,
			Name:       it.Name,
			Visibility: it.Visibility,
			InviteCode: it.InviteCode,
		}
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": out, "total": len(out)})
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}

	var req createRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	if req.Name == "" || len(req.Name) > 80 {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Nome da sala inválido")
		return
	}
	maxP := req.MaxParticipants
	if maxP <= 0 {
		maxP = 50
	}
	if maxP > 200 {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Limite máximo é 200")
		return
	}
	visibility := strings.ToLower(strings.TrimSpace(req.Visibility))
	if visibility == "" {
		visibility = models.VisibilityPublic
	}
	if visibility != models.VisibilityPublic && visibility != models.VisibilityPrivate {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Visibilidade inválida")
		return
	}

	room, err := h.svc.Create(r.Context(), sess, CreateInput{
		Name:            req.Name,
		Description:     req.Description,
		Visibility:      visibility,
		Password:        req.Password,
		MaxParticipants: maxP,
	})
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}

	part, err := h.svc.ActiveParticipant(r.Context(), room.ID.Hex(), sess.ID)
	if err == nil {
		h.publishParticipantJoined(r.Context(), room.ID.Hex(), part.DisplayName, part.Role)
	}

	httpx.WriteJSON(w, http.StatusCreated, map[string]any{
		"id":          room.ID.Hex(),
		"name":        room.Name,
		"slug":        room.Slug,
		"invite_code": room.InviteCode,
		"visibility":  room.Visibility,
	})
}

func (h *Handler) previewRoom(w http.ResponseWriter, r *http.Request) {
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	room, err := h.svc.GetByID(r.Context(), roomID)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	if room.Visibility == models.VisibilityPrivate {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Recurso não encontrado")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"id":                room.ID.Hex(),
		"name":              room.Name,
		"description":       room.Description,
		"visibility":        room.Visibility,
		"password_required": room.PasswordHash != "",
	})
}

func (h *Handler) entryRoom(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	room, err := h.svc.GetByID(r.Context(), roomID)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	_, partErr := h.svc.ActiveParticipant(r.Context(), roomID.Hex(), sess.ID)
	canResume, isHost := h.svc.RoomEntryFlags(r.Context(), room, sess)
	if partErr == nil {
		canResume = true
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{
		"id":                  room.ID.Hex(),
		"name":                room.Name,
		"description":         room.Description,
		"visibility":          room.Visibility,
		"password_required":   room.PasswordHash != "",
		"direct_join_allowed": CanDirectJoin(room),
		"can_resume":          canResume,
		"is_host":             isHost,
	})
}

func (h *Handler) roomCover(w http.ResponseWriter, r *http.Request) {
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	jpeg, err := h.svc.PublicCoverJPEG(r.Context(), roomID)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "public, max-age=15")
	_, _ = w.Write(jpeg)
}

func (h *Handler) uploadRoomCover(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	if err := h.svc.EnsureActiveParticipant(r.Context(), roomID.Hex(), sess.ID); err != nil {
		writeRoomErr(w, err)
		return
	}
	var req struct {
		ImageBase64 string `json:"image_base64"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}
	raw := strings.TrimSpace(req.ImageBase64)
	if i := strings.Index(raw, ","); i >= 0 {
		raw = raw[i+1:]
	}
	jpeg, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Imagem inválida")
		return
	}
	if err := h.svc.SavePreviewJPEG(r.Context(), roomID, jpeg); err != nil {
		writeRoomErr(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) getRoom(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	part, err := h.svc.ActiveParticipant(r.Context(), roomID.Hex(), sess.ID)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	room, err := h.svc.GetByID(r.Context(), roomID)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	resp := map[string]any{
		"id":                room.ID.Hex(),
		"name":              room.Name,
		"description":       room.Description,
		"visibility":        room.Visibility,
		"password_required": room.PasswordHash != "",
	}
	if part.Role == models.RoleHost {
		resp["invite_code"] = room.InviteCode
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) screenSignal(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	if err := h.svc.EnsureActiveParticipant(r.Context(), roomID.Hex(), sess.ID); err != nil {
		writeRoomErr(w, err)
		return
	}
	var req struct {
		Action string `json:"action"`
	}
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}
	eventType := realtime.EventScreenStopped
	if req.Action == "start" {
		eventType = realtime.EventScreenStarted
	} else if req.Action != "stop" {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "action deve ser start ou stop")
		return
	}
	active := req.Action == "start"
	if err := h.svc.SetBroadcastActive(r.Context(), roomID, active); err != nil {
		writeRoomErr(w, err)
		return
	}
	part, _ := h.svc.ActiveParticipant(r.Context(), roomID.Hex(), sess.ID)
	h.hub.Publish(r.Context(), roomID.Hex(), eventType, map[string]string{
		"session_id":   sess.ID.Hex(),
		"display_name": part.DisplayName,
	})
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) join(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	var req joinRequest
	_ = httpx.DecodeJSON(r, &req)

	part, err := h.svc.Join(r.Context(), roomID, sess, JoinInput{Password: req.Password})
	if err != nil {
		writeRoomErr(w, err)
		return
	}

	h.publishParticipantJoined(r.Context(), roomID.Hex(), part.DisplayName, part.Role)

	h.writeJoinResponse(w, roomID, sess, part)
}

func (h *Handler) joinByCode(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	var req joinByCodeRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}
	room, part, err := h.svc.JoinByInviteCode(r.Context(), req.Code, sess, JoinInput{Password: req.Password})
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	h.publishParticipantJoined(r.Context(), room.ID.Hex(), part.DisplayName, part.Role)
	h.writeJoinResponse(w, room.ID, sess, part)
}

func (h *Handler) writeJoinResponse(
	w http.ResponseWriter,
	roomID primitive.ObjectID,
	sess session.Session,
	part models.RoomParticipant,
) {
	body := map[string]any{
		"room_id":        roomID.Hex(),
		"participant_id": part.ID.Hex(),
		"role":           part.Role,
	}
	if lk, err := livekitauth.MintParticipantToken(h.cfg, roomID, sess.ID, part); err == nil {
		body["livekit"] = lk
	}
	httpx.WriteJSON(w, http.StatusOK, body)
}

func (h *Handler) leave(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	deleted, err := h.svc.Leave(r.Context(), roomID, sess)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventParticipantLeft, map[string]string{
		"session_id": sess.ID.Hex(),
	})
	if deleted {
		h.publishRoomClosed(r.Context(), roomID)
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) closeRoom(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	if err := h.svc.Close(r.Context(), roomID, sess); err != nil {
		writeRoomErr(w, err)
		return
	}
	h.publishRoomClosed(r.Context(), roomID)
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "closed"})
}

func (h *Handler) listParticipants(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	if err := h.svc.EnsureActiveParticipant(r.Context(), roomID.Hex(), sess.ID); err != nil {
		writeRoomErr(w, err)
		return
	}
	parts, err := h.svc.ListParticipants(r.Context(), roomID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao listar participantes")
		return
	}
	items := make([]map[string]any, 0, len(parts))
	for _, p := range parts {
		items = append(items, map[string]any{
			"id":           p.ID.Hex(),
			"display_name": p.DisplayName,
			"role":         p.Role,
			"can_publish":  p.CanPublish,
			"muted":        p.Muted,
			"session_id":   p.SessionID.Hex(),
		})
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) removeParticipant(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	pid, err := primitive.ObjectIDFromHex(chi.URLParam(r, "participantID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	deleted, err := h.svc.RemoveParticipant(r.Context(), roomID, pid, sess)
	if err != nil {
		writeRoomErr(w, err)
		return
	}
	h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventParticipantLeft, map[string]string{
		"participant_id": pid.Hex(),
	})
	if deleted {
		h.publishRoomClosed(r.Context(), roomID)
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

func (h *Handler) patchPermissions(w http.ResponseWriter, r *http.Request) {
	sess, ok := auth.SessionFromContext(r.Context())
	if !ok {
		writeUnauthorized(w)
		return
	}
	roomID, err := parseRoomID(r)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	pid, err := primitive.ObjectIDFromHex(chi.URLParam(r, "participantID"))
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "ID inválido")
		return
	}
	var req permissionRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "invalid_body", "Corpo JSON inválido")
		return
	}
	if err := h.svc.PatchPermissions(r.Context(), roomID, pid, sess, PermissionPatch{
		CanPublish: req.CanPublish,
		Muted:      req.Muted,
		Role:       req.Role,
	}); err != nil {
		writeRoomErr(w, err)
		return
	}
	if req.Muted != nil && *req.Muted {
		h.hub.Publish(r.Context(), roomID.Hex(), realtime.EventParticipantMuted, map[string]string{
			"participant_id": pid.Hex(),
		})
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) publishParticipantJoined(ctx context.Context, roomID, displayName, role string) {
	h.hub.Publish(ctx, roomID, realtime.EventParticipantJoined, map[string]any{
		"session_id":   "",
		"display_name": displayName,
		"role":         role,
	})
}

func (h *Handler) publishRoomClosed(ctx context.Context, roomID primitive.ObjectID) {
	h.hub.Publish(ctx, roomID.Hex(), realtime.EventRoomClosed, map[string]string{
		"room_id": roomID.Hex(),
	})
}

func parseRoomID(r *http.Request) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(chi.URLParam(r, "roomID"))
}

func writeUnauthorized(w http.ResponseWriter) {
	httpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "Autenticação necessária")
}

func writeRoomErr(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Recurso não encontrado")
	case errors.Is(err, ErrForbidden):
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "Sem permissão")
	case errors.Is(err, ErrWrongPassword):
		httpx.WriteError(w, http.StatusUnauthorized, "wrong_password", "Senha da sala incorreta")
	case errors.Is(err, ErrRoomFull):
		httpx.WriteError(w, http.StatusConflict, "room_full", "Sala cheia")
	case errors.Is(err, ErrRoomClosed):
		httpx.WriteError(w, http.StatusGone, "room_closed", "Sala encerrada")
	case errors.Is(err, ErrPrivateJoinRequiresInvite):
		httpx.WriteError(w, http.StatusForbidden, "invite_required", "Use o código de convite para entrar nesta sala")
	case errors.Is(err, ErrInvalidPreview):
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Pré-visualização inválida")
	default:
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", err.Error())
	}
}
