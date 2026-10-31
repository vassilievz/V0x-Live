package rooms

import (
	"errors"
	"testing"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

func TestPrivateRoomDirectJoinBlocked(t *testing.T) {
	t.Parallel()
	room := models.Room{Visibility: models.VisibilityPrivate}
	if CanDirectJoin(room) {
		t.Fatal("private rooms must not allow direct join")
	}
	if !errors.Is(ErrPrivateJoinRequiresInvite, ErrPrivateJoinRequiresInvite) {
		t.Fatal("sentinel must remain stable for API mapping")
	}
}

func TestPublicRoomDirectJoinAllowed(t *testing.T) {
	t.Parallel()
	if !CanDirectJoin(models.Room{Visibility: models.VisibilityPublic}) {
		t.Fatal("public rooms must allow direct join")
	}
}
