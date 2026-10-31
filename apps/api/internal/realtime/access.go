package realtime

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RoomAccess breaks the import cycle with rooms (hub handlers only need membership checks).
type RoomAccess interface {
	EnsureActiveParticipant(ctx context.Context, roomID string, sessionID primitive.ObjectID) error
}
