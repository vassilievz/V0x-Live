package rooms

import "github.com/v0xlive/v0x-live/apps/api/internal/models"

// CanDirectJoin reports whether POST /rooms/{id}/join may proceed without an invite code.
func CanDirectJoin(room models.Room) bool {
	return room.Visibility != models.VisibilityPrivate
}
