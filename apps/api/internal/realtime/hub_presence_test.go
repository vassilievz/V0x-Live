package realtime

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestHubUniqueSessions(t *testing.T) {
	t.Parallel()
	hub := NewHub()
	s1 := primitive.NewObjectID()
	s2 := primitive.NewObjectID()
	room := "abc123"

	c1 := &Client{hub: hub, roomID: room, sessionID: s1}
	c2 := &Client{hub: hub, roomID: room, sessionID: s1}
	c3 := &Client{hub: hub, roomID: room, sessionID: s2}

	hub.registerClient(room, c1)
	hub.registerClient(room, c2)
	hub.registerClient(room, c3)

	if got := hub.UniqueSessions(room); got != 2 {
		t.Fatalf("UniqueSessions = %d want 2", got)
	}

	hub.unregisterClient(c2)
	if got := hub.SessionConnectionCount(room, s1); got != 1 {
		t.Fatalf("SessionConnectionCount s1 = %d want 1", got)
	}
}
