package cine

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

type CatalogHandler struct {
	svc *CatalogService
}

func NewCatalogHandler(svc *CatalogService) *CatalogHandler {
	if svc == nil {
		svc = NewCatalogService()
	}
	return &CatalogHandler{svc: svc}
}

func (h *CatalogHandler) RegisterRoutes(r chi.Router) {
	r.Get("/catalog", h.getCatalog)
	r.Get("/meta", h.getMeta)
}

func (h *CatalogHandler) getCatalog(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")
	if len(search) > 120 {
		search = search[:120]
	}

	resp, err := h.svc.ListCatalog(r.Context(), category, search)
	if err != nil {
		writeCatalogUpstreamError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

func (h *CatalogHandler) getMeta(w http.ResponseWriter, r *http.Request) {
	metaType := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("type")))
	imdbID := strings.TrimSpace(r.URL.Query().Get("imdbId"))
	if imdbID == "" {
		imdbID = strings.TrimSpace(r.URL.Query().Get("imdb_id"))
	}

	switch metaType {
	case "series", "serie", "anime", "dorama":
		mediaID := strings.TrimSpace(r.URL.Query().Get("mediaId"))
		if mediaID == "" {
			mediaID = strings.TrimSpace(r.URL.Query().Get("media_id"))
		}
		resp, err := h.svc.GetSeriesMeta(r.Context(), imdbID, mediaID)
		if err != nil {
			if errors.Is(err, errInvalidIMDB) || strings.Contains(err.Error(), "invalid imdb") {
				httpx.WriteError(w, http.StatusBadRequest, "invalid_imdb_id", "ID IMDb inválido.")
				return
			}
			writeCatalogUpstreamError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, resp)
	case "movie", "filme":
		httpx.WriteJSON(w, http.StatusOK, map[string]any{
			"imdb_id": imdbID,
			"type":    ContentFilme,
		})
	default:
		httpx.WriteError(w, http.StatusBadRequest, "invalid_type", "type deve ser movie ou series.")
	}
}

func writeCatalogUpstreamError(w http.ResponseWriter, err error) {
	httpx.WriteError(w, http.StatusBadGateway, "catalog_upstream", "Não foi possível carregar o catálogo agora. Tente novamente.")
}

var errInvalidIMDB = errors.New("invalid imdb id")
