//go:build integration

package rooms

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

func integrationMongoURL(t *testing.T) string {
	t.Helper()
	if u := os.Getenv("MONGO_TEST_URI"); u != "" {
		return u
	}
	return "mongodb://127.0.0.1:27017/v0xlive_integration_test"
}

func setupIntegration(t *testing.T) (*database.Store, *Service, *session.Manager) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	store, err := database.Connect(ctx, integrationMongoURL(t))
	if err != nil {
		t.Skipf("MongoDB indisponível para integração: %v", err)
	}

	prefix := primitive.NewObjectID().Hex()
	for _, name := range []string{"rooms", "room_participants", "user_sessions", "users"} {
		_, _ = store.Collection(name).DeleteMany(ctx, bson.M{})
	}

	svc := NewService(store)
	sessions := session.NewManager(store, "test_session", "", time.Hour, false)
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		for _, name := range []string{"rooms", "room_participants", "user_sessions", "users"} {
			_, _ = store.Collection(name).DeleteMany(cleanup, bson.M{})
		}
		_ = store.Close(cleanup)
	})
	_ = prefix
	return store, svc, sessions
}

func guestSession(t *testing.T, sessions *session.Manager, name string) session.Session {
	t.Helper()
	ctx := context.Background()
	_, sess, err := sessions.CreateGuest(ctx, name)
	if err != nil {
		t.Fatalf("CreateGuest: %v", err)
	}
	return sess
}

func TestIntegrationPublicRoomDirectJoin(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Pública",
		Visibility:      models.VisibilityPublic,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	visitor := guestSession(t, sessions, "Visitante")
	_, err = svc.Join(context.Background(), room.ID, visitor, JoinInput{})
	if err != nil {
		t.Fatalf("Join public: %v", err)
	}
}

func TestIntegrationPrivateRoomBlocksDirectJoin(t *testing.T) {
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

	visitor := guestSession(t, sessions, "Intruder")
	_, err = svc.Join(context.Background(), room.ID, visitor, JoinInput{})
	if !errors.Is(err, ErrPrivateJoinRequiresInvite) {
		t.Fatalf("Join private by ID: got %v want ErrPrivateJoinRequiresInvite", err)
	}
}

func TestIntegrationPrivateRoomHostResumesJoinAfterCreate(t *testing.T) {
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

	part, err := svc.Join(context.Background(), room.ID, host, JoinInput{})
	if err != nil {
		t.Fatalf("Join as host after create: %v", err)
	}
	if part.Role != models.RoleHost {
		t.Fatalf("role = %q want host", part.Role)
	}
}

func TestIntegrationPrivateRoomJoinByInviteCode(t *testing.T) {
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

	visitor := guestSession(t, sessions, "Convidado")
	gotRoom, _, err := svc.JoinByInviteCode(context.Background(), room.InviteCode, visitor, JoinInput{})
	if err != nil {
		t.Fatalf("JoinByInviteCode: %v", err)
	}
	if gotRoom.ID != room.ID {
		t.Fatal("room mismatch")
	}
}

func TestIntegrationInvalidInviteCode(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	visitor := guestSession(t, sessions, "Visitante")
	_, _, err := svc.JoinByInviteCode(context.Background(), "ZZZZZZ", visitor, JoinInput{})
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("got %v want ErrNotFound", err)
	}
}

func TestIntegrationClosedRoomInviteRejected(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Fechada",
		Visibility:      models.VisibilityPrivate,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if err := svc.Close(context.Background(), room.ID, host); err != nil {
		t.Fatalf("Close: %v", err)
	}

	visitor := guestSession(t, sessions, "Late")
	_, _, err = svc.JoinByInviteCode(context.Background(), room.InviteCode, visitor, JoinInput{})
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("closed room invite: got %v want ErrNotFound", err)
	}
}

func TestIntegrationInvalidRoomObjectID(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	visitor := guestSession(t, sessions, "Visitante")
	badID, _ := primitive.ObjectIDFromHex("000000000000000000000000")
	_, err := svc.Join(context.Background(), badID, visitor, JoinInput{})
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("got %v want ErrNotFound", err)
	}
}

func TestIntegrationListParticipantsRequiresMembership(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Pública",
		Visibility:      models.VisibilityPublic,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
 outsider := guestSession(t, sessions, "Outsider")
	if err := svc.EnsureActiveParticipant(context.Background(), room.ID.Hex(), outsider.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("EnsureActiveParticipant: got %v want ErrNotFound", err)
	}
}

func TestIntegrationCanDirectJoinPolicyMatchesJoin(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	priv, err := svc.Create(context.Background(), host, CreateInput{
		Name:       "P",
		Visibility: models.VisibilityPrivate,
	})
	if err != nil {
		t.Fatal(err)
	}
	if CanDirectJoin(priv) {
		t.Fatal("policy should block direct join")
	}
	pub, err := svc.Create(context.Background(), host, CreateInput{
		Name:       "Pub",
		Visibility: models.VisibilityPublic,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !CanDirectJoin(pub) {
		t.Fatal("policy should allow public direct join")
	}
}

func TestIntegrationPublicRoomOwnerResumesHostWithNewSession(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	if host.UserID == nil {
		t.Fatal("expected guest user id")
	}
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Pública owner",
		Visibility:      models.VisibilityPublic,
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

	_, resumedSession, err := sessions.CreateGuest(context.Background(), "Host return")
	if err != nil {
		t.Fatalf("CreateGuest: %v", err)
	}
	resumedSession.UserID = host.UserID

	part, err := svc.Join(context.Background(), room.ID, resumedSession, JoinInput{})
	if err != nil {
		t.Fatalf("Join owner resume: %v", err)
	}
	if part.Role != models.RoleHost {
		t.Fatalf("role = %q want host", part.Role)
	}
}

func TestIntegrationListPublicCountsActiveParticipants(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Contagem",
		Visibility:      models.VisibilityPublic,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	visitor := guestSession(t, sessions, "Visitante")
	if _, err := svc.Join(context.Background(), room.ID, visitor, JoinInput{}); err != nil {
		t.Fatalf("Join visitor: %v", err)
	}

	items, err := svc.ListPublic(context.Background())
	if err != nil {
		t.Fatalf("ListPublic: %v", err)
	}
	var found *PublicRoomItem
	for i := range items {
		if items[i].ID == room.ID.Hex() {
			found = &items[i]
			break
		}
	}
	if found == nil {
		t.Fatal("room missing from public list")
	}
	if found.ParticipantCount != 2 {
		t.Fatalf("participant_count = %d want 2 (host + visitor)", found.ParticipantCount)
	}
}

func TestIntegrationRoomPurgedWhenLastParticipantLeaves(t *testing.T) {
	_, svc, sessions := setupIntegration(t)
	host := guestSession(t, sessions, "Host")
	room, err := svc.Create(context.Background(), host, CreateInput{
		Name:            "Efêmera",
		Visibility:      models.VisibilityPublic,
		MaxParticipants: 10,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	deleted, err := svc.Leave(context.Background(), room.ID, host)
	if err != nil {
		t.Fatalf("Leave: %v", err)
	}
	if !deleted {
		t.Fatal("expected room deleted when last participant left")
	}

	_, err = svc.GetByID(context.Background(), room.ID)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("GetByID after purge: got %v want ErrNotFound", err)
	}
}
