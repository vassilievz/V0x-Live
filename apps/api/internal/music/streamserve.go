package music

import (
	"net/http"
	"net/url"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

// StreamResourceProxyBase is the same-origin prefix for HLS segment URLs (feature = "music" | "cine").
func StreamResourceProxyBase(roomID primitive.ObjectID, feature string) string {
	return "/api/v1/rooms/" + roomID.Hex() + "/" + feature + "/stream/resource?url="
}

func ServeHLSManifest(w http.ResponseWriter, r *http.Request, roomID primitive.ObjectID, manifestRaw, feature string) {
	manifestURL, ok := AllowedStreamURL(manifestRaw, manifestRaw)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "Manifest inválido")
		return
	}

	res, err := fetchUpstream(r.Context(), manifestURL.String(), "")
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "upstream_error", "Não foi possível buscar o manifest")
		return
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		res.Body.Close()
		httpx.WriteError(w, http.StatusBadGateway, "upstream_error", "Manifest indisponível")
		return
	}

	body, err := readUpstreamBody(res, maxManifestBytes)
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "upstream_error", "Erro ao ler manifest")
		return
	}

	proxyBase := StreamResourceProxyBase(roomID, feature)
	proxySeg := func(abs string) string {
		return proxyBase + url.QueryEscape(abs)
	}

	rewritten, err := rewriteHLSManifest(manifestURL, manifestRaw, body, proxySeg)
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "upstream_error", "Manifest HLS inválido")
		return
	}

	w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
	w.Header().Set("Cache-Control", "no-cache")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(rewritten)
}

func ServeUpstreamMedia(w http.ResponseWriter, r *http.Request, upstreamRaw string) {
	target, ok := AllowedStreamURL(upstreamRaw, upstreamRaw)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "validation_error", "URL inválida")
		return
	}

	rangeHeader := r.Header.Get("Range")
	res, err := fetchUpstream(r.Context(), target.String(), rangeHeader)
	if err != nil {
		httpx.WriteError(w, http.StatusBadGateway, "upstream_error", "Não foi possível buscar o vídeo")
		return
	}
	if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusPartialContent {
		res.Body.Close()
		httpx.WriteError(w, http.StatusBadGateway, "upstream_error", "Vídeo indisponível")
		return
	}

	if err := copyUpstream(w, res, maxUpstreamBody); err != nil {
		return
	}
}

func ServeDirectStreamResource(
	w http.ResponseWriter,
	r *http.Request,
	roomID primitive.ObjectID,
	anchorURL string,
	rawTarget string,
	feature string,
) {
	target, ok := AllowedStreamURL(anchorURL, rawTarget)
	if !ok {
		httpx.WriteError(w, http.StatusForbidden, "forbidden", "URL de segmento inválida")
		return
	}

	pathLower := strings.ToLower(target.Path)
	if strings.HasSuffix(pathLower, ".m3u8") {
		ServeHLSManifest(w, r, roomID, target.String(), feature)
		return
	}
	ServeUpstreamMedia(w, r, target.String())
}
