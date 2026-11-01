//go:build integration

package rooms

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
)

func TestIntegrationHTTPPreviewPublicWithoutSessionCookie(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Preview HTTP",
		Visibility:      models.VisibilityPublic,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	h := NewHandler(svc, realtime.NewHub(), config.Config{})
	r := chi.NewRouter()
	h.RegisterPublic(r)

	req := httptest.NewRequest(http.MethodGet, "/"+room.ID.Hex()+"/preview", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("preview status = %d body=%s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("json: %v", err)
	}
	if body["name"] != "Preview HTTP" {
		t.Fatalf("name = %v", body["name"])
	}
}
