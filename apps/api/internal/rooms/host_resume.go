package rooms

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

// RoomEntryFlags reports whether the current session may enter without an invite code.
func (s *Service) RoomEntryFlags(ctx context.Context, room models.Room, sess session.Session) (canResume, isHost bool) {
	_ = s.PruneStaleParticipants(ctx, room.ID)
	if part, err := s.findActiveParticipant(ctx, room.ID, sess.ID); err == nil {
		return true, part.Role == models.RoleHost
	}
	if room.OwnerID != nil && sess.UserID != nil && *room.OwnerID == *sess.UserID {
		return true, true
	}
	hostPart, err := s.findHostParticipant(ctx, room.ID)
	if err != nil {
		return false, false
	}
	if hostPart.SessionID == sess.ID {
		return true, true
	}
	if s.hostParticipantOrphaned(ctx, hostPart) && s.mayClaimOrphanHost(room, hostPart, sess) {
		return true, true
	}
	return false, false
}

func (s *Service) resumePrivateRoomHost(ctx context.Context, room models.Room, sess session.Session, in JoinInput) (models.RoomParticipant, bool, error) {
	if CanDirectJoin(room) {
		return models.RoomParticipant{}, false, nil
	}
	if err := s.checkRoomPassword(room, in.Password); err != nil {
		return models.RoomParticipant{}, true, err
	}

	if room.OwnerID != nil && sess.UserID != nil && *room.OwnerID == *sess.UserID {
		hostPart, err := s.findHostParticipant(ctx, room.ID)
		if err != nil {
			return models.RoomParticipant{}, true, err
		}
		part, err := s.claimHostParticipant(ctx, room, hostPart, sess)
		return part, true, err
	}

	hostPart, err := s.findHostParticipant(ctx, room.ID)
	if err != nil {
		return models.RoomParticipant{}, false, nil
	}
	if hostPart.SessionID == sess.ID {
		if hostPart.LeftAt == nil {
			part, err := s.syncParticipantDisplayName(ctx, hostPart, sess)
			return part, true, err
		}
		part, err := s.reactivateParticipant(ctx, room, sess, hostPart)
		return part, true, err
	}
	if !s.hostParticipantOrphaned(ctx, hostPart) || !s.mayClaimOrphanHost(room, hostPart, sess) {
		return models.RoomParticipant{}, false, nil
	}
	part, err := s.claimHostParticipant(ctx, room, hostPart, sess)
	return part, true, err
}

func (s *Service) mayClaimOrphanHost(room models.Room, hostPart models.RoomParticipant, sess session.Session) bool {
	if room.OwnerID != nil && sess.UserID != nil {
		return *room.OwnerID == *sess.UserID
	}
	if room.OwnerID != nil {
		return false
	}
	if !sess.IsGuest {
		return false
	}
	if hostPart.UserID != nil && sess.UserID != nil {
		return *hostPart.UserID == *sess.UserID
	}
	return hostPart.UserID == nil
}

func (s *Service) findHostParticipant(ctx context.Context, roomID primitive.ObjectID) (models.RoomParticipant, error) {
	var p models.RoomParticipant
	err := s.participants.FindOne(ctx, bson.M{
		"room_id": roomID,
		"role":    models.RoleHost,
	}, options.FindOne().SetSort(bson.D{{Key: "joined_at", Value: -1}})).Decode(&p)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.RoomParticipant{}, ErrNotFound
		}
		return models.RoomParticipant{}, err
	}
	return p, nil
}

func (s *Service) hostParticipantOrphaned(ctx context.Context, hostPart models.RoomParticipant) bool {
	if hostPart.LeftAt != nil {
		return true
	}
	return s.sessionInactive(ctx, hostPart.SessionID)
}

func (s *Service) sessionInactive(ctx context.Context, sessionID primitive.ObjectID) bool {
	err := s.sessions.FindOne(ctx, bson.M{
		"_id":        sessionID,
		"revoked_at": nil,
		"expires_at": bson.M{"$gt": time.Now().UTC()},
	}).Err()
	return errors.Is(err, mongo.ErrNoDocuments)
}

func (s *Service) claimHostParticipant(ctx context.Context, room models.Room, hostPart models.RoomParticipant, sess session.Session) (models.RoomParticipant, error) {
	if hostPart.Role != models.RoleHost {
		return models.RoomParticipant{}, ErrForbidden
	}
	displayName, err := s.displayName(ctx, sess)
	if err != nil {
		return models.RoomParticipant{}, err
	}
	now := time.Now().UTC()
	_, err = s.participants.UpdateOne(ctx, bson.M{"_id": hostPart.ID}, bson.M{
		"$set": bson.M{
			"session_id":   sess.ID,
			"user_id":      sess.UserID,
			"display_name": displayName,
			"joined_at":    now,
		},
		"$unset": bson.M{"left_at": ""},
	})
	if err != nil {
		return models.RoomParticipant{}, err
	}
	hostPart.SessionID = sess.ID
	hostPart.UserID = sess.UserID
	hostPart.DisplayName = displayName
	hostPart.JoinedAt = now
	hostPart.LeftAt = nil
	_, _ = s.rooms.UpdateOne(ctx, bson.M{"_id": room.ID}, bson.M{"$set": bson.M{"updated_at": now}})
	return hostPart, nil
}
