package rooms

import (
	"testing"
	"time"

	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
)

func TestPublicParticipantCountBootstrapVsStale(t *testing.T) {
	t.Parallel()
	hub := realtime.NewHub()
	p := &RealtimePresence{hub: hub, pending: make(map[string]pendingLeave)}
	roomID := "room1"
	fresh := time.Now().UTC()
	stale := time.Now().UTC().Add(-2 * time.Minute)

	if got := p.PublicParticipantCount(roomID, fresh, 4); got != 4 {
		t.Fatalf("fresh mongo count = %d want 4", got)
	}
	if got := p.PublicParticipantCount(roomID, stale, 6); got != 6 {
		t.Fatalf("stale mongo count must be preserved = %d want 6", got)
	}
}
