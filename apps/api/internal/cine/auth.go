package cine

import (
	"context"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
	"github.com/v0xlive/v0x-live/apps/api/internal/rooms"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func isRoomHostOwner(ctx context.Context, roomSvc *rooms.Service, roomID primitive.ObjectID, part *models.RoomParticipant) bool {
	if part == nil || part.Role != models.RoleHost {
		return false
	}
	room, err := roomSvc.GetByID(ctx, roomID)
	if err != nil {
		return false
	}
	if room.OwnerID == nil {
		return true
	}
	if part.UserID == nil {
		return false
	}
	return part.UserID.Hex() == room.OwnerID.Hex()
}
