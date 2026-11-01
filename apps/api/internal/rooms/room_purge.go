package rooms

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

// tryDeleteRoomIfEmpty removes the room and related documents when nobody is active.
// Rooms created less than safeParticipantGrace (2m) ago are never purged, protecting
// newly created rooms from race conditions during setup/navigation.
func (s *Service) tryDeleteRoomIfEmpty(ctx context.Context, roomID primitive.ObjectID) (bool, error) {
	count, err := s.activeCount(ctx, roomID)
	if err != nil {
		return false, err
	}
	if count > 0 {
		return false, nil
	}

	var room models.Room
	if err := s.rooms.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room); err == nil {
		if time.Since(room.CreatedAt) < safeParticipantGrace {
			return false, nil
		}
	}

	if err := s.deleteRoomCascade(ctx, roomID); err != nil {
		return false, err
	}
	return true, nil
}

func (s *Service) deleteRoomCascade(ctx context.Context, roomID primitive.ObjectID) error {
	s.destroyLiveKitRoom(roomID)
	byRoom := bson.M{"room_id": roomID}
	if _, err := s.participants.DeleteMany(ctx, byRoom); err != nil {
		return err
	}
	if _, err := s.chatMessages.DeleteMany(ctx, byRoom); err != nil {
		return err
	}
	if _, err := s.roomMusic.DeleteMany(ctx, byRoom); err != nil {
		return err
	}
	if _, err := s.roomCine.DeleteMany(ctx, byRoom); err != nil {
		return err
	}
	_, err := s.rooms.DeleteOne(ctx, bson.M{"_id": roomID})
	return err
}
