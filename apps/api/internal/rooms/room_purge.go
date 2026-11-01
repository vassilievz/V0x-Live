package rooms

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// tryDeleteRoomIfEmpty removes the room and related documents when nobody is active.
func (s *Service) tryDeleteRoomIfEmpty(ctx context.Context, roomID primitive.ObjectID) (bool, error) {
	count, err := s.activeCount(ctx, roomID)
	if err != nil {
		return false, err
	}
	if count > 0 {
		return false, nil
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
