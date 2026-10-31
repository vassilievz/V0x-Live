package cine

import (
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
	"github.com/v0xlive/v0x-live/apps/api/internal/music"
)

func (h *Handler) stream(w http.ResponseWriter, r *http.Request) {
	_, roomID, _, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	doc, err := h.findByRoom(r.Context(), roomID)
	if err == mongo.ErrNoDocuments {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhuma sessão Cine ativa")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar stream")
		return
	}
	if doc.Mode != ModeDirect || doc.SourceURL == "" {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhum vídeo direto ativo no Cine")
		return
	}

	switch doc.MediaType {
	case "hls":
		music.ServeHLSManifest(w, r, roomID, doc.SourceURL, "cine")
	case "mp4":
		music.ServeUpstreamMedia(w, r, doc.SourceURL)
	default:
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Tipo de mídia não suportado")
	}
}

func (h *Handler) streamResource(w http.ResponseWriter, r *http.Request) {
	_, roomID, _, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	doc, err := h.findByRoom(r.Context(), roomID)
	if err != nil || doc.Mode != ModeDirect || doc.SourceURL == "" {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhum vídeo direto ativo no Cine")
		return
	}

	rawTarget := strings.TrimSpace(r.URL.Query().Get("url"))
	music.ServeDirectStreamResource(w, r, roomID, doc.SourceURL, rawTarget, "cine")
}
