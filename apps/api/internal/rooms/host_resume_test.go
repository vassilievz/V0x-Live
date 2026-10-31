//go:build integration

package rooms

import (
	"context"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

func TestIntegrationPrivateHostCanResumeAfterStaleMark(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Privada",
		Visibility:      models.VisibilityPrivate,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	now := time.Now().UTC()
	_, err = svc.participants.UpdateMany(context.Background(), bson.M{
		"room_id": room.ID,
		"role":    models.RoleHost,
	}, bson.M{"$set": bson.M{"left_at": now}})
	if err != nil {
		t.Fatalf("mark host left: %v", err)
	}

	canResume, isHost := svc.RoomEntryFlags(context.Background(), room, host)
	if !canResume || !isHost {
		t.Fatalf("RoomEntryFlags = (%v,%v) want true,true", canResume, isHost)
	}

	part, ok, err := svc.resumeRoomHost(context.Background(), room, host, JoinInput{})
	if err != nil || !ok {
		t.Fatalf("resumePrivateRoomHost: ok=%v err=%v", ok, err)
	}
	if part.Role != models.RoleHost {
		t.Fatalf("role = %q want host", part.Role)
	}
}
