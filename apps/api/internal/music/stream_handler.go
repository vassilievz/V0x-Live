package music

import (
	"net/http"
	"strings"

	"go.mongodb.org/mongo-driver/mongo"

	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

func (h *Handler) stream(w http.ResponseWriter, r *http.Request) {
	_, roomID, _, ok := h.roomParticipant(w, r)
	if !ok {
		return
	}
	doc, err := h.findByRoom(r.Context(), roomID)
	if err == mongo.ErrNoDocuments {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhum vídeo ativo")
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "server_error", "Erro ao carregar stream")
		return
	}
	if doc.Platform != "direct" || doc.SourceURL == "" {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhum vídeo direto ativo")
		return
	}

	switch doc.MediaType {
	case "hls":
		ServeHLSManifest(w, r, roomID, doc.SourceURL, "music")
	case "mp4":
		ServeUpstreamMedia(w, r, doc.SourceURL)
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
	if err != nil || doc.Platform != "direct" || doc.SourceURL == "" {
		httpx.WriteError(w, http.StatusNotFound, "not_found", "Nenhum vídeo direto ativo")
		return
	}

	rawTarget := strings.TrimSpace(r.URL.Query().Get("url"))
	ServeDirectStreamResource(w, r, roomID, doc.SourceURL, rawTarget, "music")
}
