package rooms

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"regexp"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth/password"
	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrForbidden     = errors.New("forbidden")
	ErrRoomClosed    = errors.New("room closed")
	ErrWrongPassword = errors.New("wrong password")
	ErrRoomFull      = errors.New("room full")
	ErrAlreadyInRoom = errors.New("already in room")
	// ErrPrivateJoinRequiresInvite blocks direct join by room ObjectID for private rooms.
	ErrPrivateJoinRequiresInvite = errors.New("private room requires invite code")
	ErrInvalidPreview            = errors.New("invalid preview")
)

const maxPreviewJPEGBytes = 120 * 1024
const previewMaxAge = 20 * time.Minute

var slugRe = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type Service struct {
	rooms        *mongo.Collection
	participants *mongo.Collection
	users        *mongo.Collection
	sessions     *mongo.Collection
	chatMessages *mongo.Collection
	roomMusic    *mongo.Collection
	roomCine     *mongo.Collection
	presence     *RealtimePresence
}

func NewService(store *database.Store) *Service {
	return &Service{
		rooms:        store.Collection("rooms"),
		participants: store.Collection("room_participants"),
		users:        store.Collection("users"),
		sessions:     store.Collection("user_sessions"),
		chatMessages: store.Collection("chat_messages"),
		roomMusic:    store.Collection("room_music"),
		roomCine:     store.Collection("room_cine"),
	}
}

func (s *Service) SetRealtimePresence(p *RealtimePresence) {
	s.presence = p
}

type PublicRoomItem struct {
	ID               string
	Name             string
	Description      string
	ParticipantCount int
	IsLive           bool
	HasPreview       bool
}

func previewFresh(updatedAt time.Time, jpeg []byte) bool {
	if len(jpeg) == 0 || updatedAt.IsZero() {
		return false
	}
	return time.Since(updatedAt) <= previewMaxAge
}

func (s *Service) ListPublic(ctx context.Context) ([]PublicRoomItem, error) {
	cur, err := s.rooms.Find(ctx, bson.M{
		"visibility": models.VisibilityPublic,
		"status":     models.StatusActive,
	}, options.Find().SetSort(bson.M{"updated_at": -1}).SetLimit(50))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	items := make([]PublicRoomItem, 0)
	for cur.Next(ctx) {
		var room models.Room
		if err := cur.Decode(&room); err != nil {
			return nil, err
		}
		if err := s.PruneStaleParticipants(ctx, room.ID); err != nil {
			return nil, err
		}
		count, err := s.activeCount(ctx, room.ID)
		if err != nil {
			return nil, err
		}
		displayCount := int(count)
		if s.presence != nil {
			displayCount = s.presence.PublicParticipantCount(room.ID.Hex(), room.CreatedAt, count)
		}
		if displayCount == 0 {
			continue
		}
		hasPreview := previewFresh(room.PreviewUpdatedAt, room.PreviewJPEG)
		items = append(items, PublicRoomItem{
			ID:               room.ID.Hex(),
			Name:             room.Name,
			Description:      room.Description,
			ParticipantCount: displayCount,
			IsLive:           room.BroadcastActive,
			HasPreview:       hasPreview,
		})
	}
	return items, nil
}

type OwnedRoomItem struct {
	ID         string
	Name       string
	Visibility string
	InviteCode string
}

func (s *Service) ListOwnedByUser(ctx context.Context, userID primitive.ObjectID) ([]OwnedRoomItem, error) {
	cur, err := s.rooms.Find(ctx, bson.M{
		"owner_id": userID,
		"status":   models.StatusActive,
	}, options.Find().SetSort(bson.M{"updated_at": -1}).SetLimit(40))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]OwnedRoomItem, 0)
	for cur.Next(ctx) {
		var room models.Room
		if err := cur.Decode(&room); err != nil {
			return nil, err
		}
		out = append(out, OwnedRoomItem{
			ID:         room.ID.Hex(),
			Name:       room.Name,
			Visibility: room.Visibility,
			InviteCode: room.InviteCode,
		})
	}
	return out, nil
}

func (s *Service) GetByID(ctx context.Context, roomID primitive.ObjectID) (models.Room, error) {
	var room models.Room
	err := s.rooms.FindOne(ctx, bson.M{
		"_id":    roomID,
		"status": models.StatusActive,
	}).Decode(&room)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Room{}, ErrNotFound
		}
		return models.Room{}, err
	}
	return room, nil
}

func (s *Service) GetByInviteCode(ctx context.Context, code string) (models.Room, error) {
	var room models.Room
	err := s.rooms.FindOne(ctx, bson.M{
		"invite_code": strings.ToUpper(strings.TrimSpace(code)),
		"status":      models.StatusActive,
	}).Decode(&room)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Room{}, ErrNotFound
		}
		return models.Room{}, err
	}
	return room, nil
}

type CreateInput struct {
	Name            string
	Description     string
	Visibility      string
	Password        string
	MaxParticipants int
}

func (s *Service) Create(ctx context.Context, sess session.Session, in CreateInput) (models.Room, error) {
	displayName, err := s.displayName(ctx, sess)
	if err != nil {
		return models.Room{}, err
	}

	slug := slugify(in.Name)
	if !slugRe.MatchString(slug) {
		slug = "sala-" + randomSuffix(6)
	}
	inviteCode, err := randomInviteCode()
	if err != nil {
		return models.Room{}, err
	}

	passwordHash := ""
	if in.Password != "" {
		hash, err := password.Hash(in.Password)
		if err != nil {
			return models.Room{}, err
		}
		passwordHash = hash
	}

	now := time.Now().UTC()
	var ownerID *primitive.ObjectID
	if sess.UserID != nil {
		ownerID = sess.UserID
	}

	room := models.Room{
		Name:            in.Name,
		Slug:            slug,
		Description:     in.Description,
		InviteCode:      inviteCode,
		Visibility:      in.Visibility,
		PasswordHash:    passwordHash,
		OwnerID:         ownerID,
		MaxParticipants: in.MaxParticipants,
		Status:          models.StatusActive,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	res, err := s.rooms.InsertOne(ctx, room)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			room.Slug = slug + "-" + randomSuffix(4)
			res, err = s.rooms.InsertOne(ctx, room)
		}
		if err != nil {
			return models.Room{}, err
		}
	}
	roomID, _ := res.InsertedID.(primitive.ObjectID)
	room.ID = roomID

	_, err = s.participants.InsertOne(ctx, models.RoomParticipant{
		RoomID:      roomID,
		UserID:      ownerID,
		SessionID:   sess.ID,
		DisplayName: displayName,
		Role:        models.RoleHost,
		CanPublish:  true,
		JoinedAt:    now,
	})
	if err != nil {
		_, _ = s.rooms.DeleteOne(ctx, bson.M{"_id": roomID})
		return models.Room{}, err
	}

	return room, nil
}

type JoinInput struct {
	Password string
}

func (s *Service) Join(ctx context.Context, roomID primitive.ObjectID, sess session.Session, in JoinInput) (models.RoomParticipant, error) {
	room, err := s.GetByID(ctx, roomID)
	if err != nil {
		return models.RoomParticipant{}, err
	}

	_ = s.PruneStaleParticipants(ctx, roomID)
	if existing, findErr := s.findActiveParticipant(ctx, roomID, sess.ID); findErr == nil {
		if err := s.checkRoomPassword(room, in.Password); err != nil {
			return models.RoomParticipant{}, err
		}
		return s.syncParticipantDisplayName(ctx, existing, sess)
	} else if !errors.Is(findErr, ErrNotFound) {
		return models.RoomParticipant{}, findErr
	}

	if part, ok, err := s.resumeRoomHost(ctx, room, sess, in); ok {
		return part, err
	}

	if !CanDirectJoin(room) {
		return models.RoomParticipant{}, ErrPrivateJoinRequiresInvite
	}
	return s.joinRoom(ctx, room, sess, in)
}

// JoinByInviteCode resolves the room by invite code then joins (including private rooms).
func (s *Service) JoinByInviteCode(ctx context.Context, code string, sess session.Session, in JoinInput) (models.Room, models.RoomParticipant, error) {
	room, err := s.GetByInviteCode(ctx, code)
	if err != nil {
		return models.Room{}, models.RoomParticipant{}, err
	}
	part, err := s.joinRoom(ctx, room, sess, in)
	if err != nil {
		return models.Room{}, models.RoomParticipant{}, err
	}
	return room, part, nil
}

func (s *Service) joinRoom(ctx context.Context, room models.Room, sess session.Session, in JoinInput) (models.RoomParticipant, error) {
	if err := s.checkRoomPassword(room, in.Password); err != nil {
		return models.RoomParticipant{}, err
	}
	roomID := room.ID

	_ = s.PruneStaleParticipants(ctx, roomID)

	existing, err := s.findActiveParticipant(ctx, roomID, sess.ID)
	if err == nil {
		return s.syncParticipantDisplayName(ctx, existing, sess)
	}
	if !errors.Is(err, ErrNotFound) {
		return models.RoomParticipant{}, err
	}

	prior, err := s.findParticipantBySession(ctx, roomID, sess.ID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return models.RoomParticipant{}, err
	}
	if err == nil {
		if prior.LeftAt == nil {
			return prior, nil
		}
		return s.reactivateParticipant(ctx, room, sess, prior)
	}

	count, err := s.activeCount(ctx, roomID)
	if err != nil {
		return models.RoomParticipant{}, err
	}
	if int(count) >= room.MaxParticipants {
		return models.RoomParticipant{}, ErrRoomFull
	}

	displayName, err := s.displayName(ctx, sess)
	if err != nil {
		return models.RoomParticipant{}, err
	}

	now := time.Now().UTC()
	part := models.RoomParticipant{
		RoomID:      roomID,
		UserID:      sess.UserID,
		SessionID:   sess.ID,
		DisplayName: displayName,
		Role:        models.RoleParticipant,
		CanPublish:  true,
		JoinedAt:    now,
	}
	res, err := s.participants.InsertOne(ctx, part)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			if active, findErr := s.findActiveParticipant(ctx, roomID, sess.ID); findErr == nil {
				return active, nil
			}
			if p, findErr := s.findParticipantBySession(ctx, roomID, sess.ID); findErr == nil {
				if p.LeftAt == nil {
					return p, nil
				}
				return s.reactivateParticipant(ctx, room, sess, p)
			}
		}
		return models.RoomParticipant{}, err
	}
	part.ID, _ = res.InsertedID.(primitive.ObjectID)

	_, _ = s.rooms.UpdateOne(ctx, bson.M{"_id": roomID}, bson.M{"$set": bson.M{"updated_at": now}})

	return part, nil
}

func (s *Service) Leave(ctx context.Context, roomID primitive.ObjectID, sess session.Session) (bool, error) {
	if s.presence != nil {
		s.presence.OnExplicitLeave(roomID.Hex(), sess.ID)
	}
	now := time.Now().UTC()
	res, err := s.participants.UpdateOne(ctx, bson.M{
		"room_id":    roomID,
		"session_id": sess.ID,
		"left_at":    nil,
	}, bson.M{"$set": bson.M{"left_at": now}})
	if err != nil {
		return false, err
	}
	if res.MatchedCount == 0 {
		return false, ErrNotFound
	}
	return s.tryDeleteRoomIfEmpty(ctx, roomID)
}

func (s *Service) LeaveBySessionID(ctx context.Context, roomID, sessionID primitive.ObjectID) (bool, error) {
	now := time.Now().UTC()
	res, err := s.participants.UpdateOne(ctx, bson.M{
		"room_id":    roomID,
		"session_id": sessionID,
		"left_at":    nil,
	}, bson.M{"$set": bson.M{"left_at": now}})
	if err != nil {
		return false, err
	}
	if res.MatchedCount == 0 {
		return false, nil
	}
	return s.tryDeleteRoomIfEmpty(ctx, roomID)
}

func (s *Service) ListActiveRooms(ctx context.Context, limit int64) ([]models.Room, error) {
	cur, err := s.rooms.Find(ctx, bson.M{
		"status": models.StatusActive,
	}, options.Find().SetLimit(limit))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]models.Room, 0)
	for cur.Next(ctx) {
		var room models.Room
		if err := cur.Decode(&room); err != nil {
			return nil, err
		}
		out = append(out, room)
	}
	return out, cur.Err()
}

func (s *Service) Close(ctx context.Context, roomID primitive.ObjectID, sess session.Session) error {
	part, err := s.findActiveParticipant(ctx, roomID, sess.ID)
	if err != nil {
		return err
	}
	if part.Role != models.RoleHost {
		return ErrForbidden
	}
	now := time.Now().UTC()
	_, err = s.participants.UpdateMany(ctx, bson.M{
		"room_id": roomID,
		"left_at": nil,
	}, bson.M{"$set": bson.M{"left_at": now}})
	if err != nil {
		return err
	}
	_, err = s.tryDeleteRoomIfEmpty(ctx, roomID)
	return err
}

func (s *Service) ListParticipants(ctx context.Context, roomID primitive.ObjectID) ([]models.RoomParticipant, error) {
	if err := s.PruneStaleParticipants(ctx, roomID); err != nil {
		return nil, err
	}
	cur, err := s.participants.Find(ctx, bson.M{
		"room_id": roomID,
		"left_at": nil,
	}, options.Find().SetSort(bson.D{{Key: "joined_at", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]models.RoomParticipant, 0)
	for cur.Next(ctx) {
		var p models.RoomParticipant
		if err := cur.Decode(&p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

func (s *Service) ActiveParticipant(ctx context.Context, roomID string, sessionID primitive.ObjectID) (models.RoomParticipant, error) {
	rid, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return models.RoomParticipant{}, ErrNotFound
	}
	return s.findActiveParticipant(ctx, rid, sessionID)
}

func (s *Service) EnsureActiveParticipant(ctx context.Context, roomID string, sessionID primitive.ObjectID) error {
	_, err := s.ActiveParticipant(ctx, roomID, sessionID)
	return err
}

func (s *Service) RemoveParticipant(ctx context.Context, roomID, participantID primitive.ObjectID, actor session.Session) (bool, error) {
	actorPart, err := s.findActiveParticipant(ctx, roomID, actor.ID)
	if err != nil {
		return false, err
	}
	if actorPart.Role != models.RoleHost && actorPart.Role != models.RoleModerator {
		return false, ErrForbidden
	}

	var target models.RoomParticipant
	err = s.participants.FindOne(ctx, bson.M{
		"_id":     participantID,
		"room_id": roomID,
		"left_at": nil,
	}).Decode(&target)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, ErrNotFound
		}
		return false, err
	}
	if target.Role == models.RoleHost {
		return false, ErrForbidden
	}

	now := time.Now().UTC()
	_, err = s.participants.UpdateOne(ctx, bson.M{"_id": participantID}, bson.M{
		"$set": bson.M{"left_at": now},
	})
	if err != nil {
		return false, err
	}
	return s.tryDeleteRoomIfEmpty(ctx, roomID)
}

type PermissionPatch struct {
	CanPublish *bool
	Muted      *bool
	Role       *string
}

func (s *Service) PatchPermissions(ctx context.Context, roomID, participantID primitive.ObjectID, actor session.Session, patch PermissionPatch) error {
	actorPart, err := s.findActiveParticipant(ctx, roomID, actor.ID)
	if err != nil {
		return err
	}
	if actorPart.Role != models.RoleHost {
		return ErrForbidden
	}

	set := bson.M{}
	if patch.CanPublish != nil {
		set["can_publish"] = *patch.CanPublish
	}
	if patch.Muted != nil {
		set["muted"] = *patch.Muted
	}
	if patch.Role != nil {
		role := *patch.Role
		if role != models.RoleModerator && role != models.RoleParticipant {
			return errors.New("invalid role")
		}
		set["role"] = role
	}
	if len(set) == 0 {
		return nil
	}

	res, err := s.participants.UpdateOne(ctx, bson.M{
		"_id":     participantID,
		"room_id": roomID,
		"left_at": nil,
	}, bson.M{"$set": set})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) findActiveParticipant(ctx context.Context, roomID, sessionID primitive.ObjectID) (models.RoomParticipant, error) {
	var p models.RoomParticipant
	err := s.participants.FindOne(ctx, bson.M{
		"room_id":    roomID,
		"session_id": sessionID,
		"left_at":    nil,
	}).Decode(&p)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.RoomParticipant{}, ErrNotFound
		}
		return models.RoomParticipant{}, err
	}
	return p, nil
}

func (s *Service) findParticipantBySession(ctx context.Context, roomID, sessionID primitive.ObjectID) (models.RoomParticipant, error) {
	var p models.RoomParticipant
	err := s.participants.FindOne(ctx, bson.M{
		"room_id":    roomID,
		"session_id": sessionID,
	}).Decode(&p)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.RoomParticipant{}, ErrNotFound
		}
		return models.RoomParticipant{}, err
	}
	return p, nil
}

func (s *Service) reactivateParticipant(ctx context.Context, room models.Room, sess session.Session, prior models.RoomParticipant) (models.RoomParticipant, error) {
	count, err := s.activeCount(ctx, room.ID)
	if err != nil {
		return models.RoomParticipant{}, err
	}
	if int(count) >= room.MaxParticipants {
		return models.RoomParticipant{}, ErrRoomFull
	}

	displayName, err := s.displayName(ctx, sess)
	if err != nil {
		return models.RoomParticipant{}, err
	}

	now := time.Now().UTC()
	_, err = s.participants.UpdateOne(ctx, bson.M{"_id": prior.ID}, bson.M{
		"$set": bson.M{
			"joined_at":    now,
			"display_name": displayName,
			"user_id":      sess.UserID,
		},
		"$unset": bson.M{"left_at": ""},
	})
	if err != nil {
		return models.RoomParticipant{}, err
	}

	prior.LeftAt = nil
	prior.JoinedAt = now
	prior.DisplayName = displayName
	prior.UserID = sess.UserID

	_, _ = s.rooms.UpdateOne(ctx, bson.M{"_id": room.ID}, bson.M{"$set": bson.M{"updated_at": now}})

	return prior, nil
}

func (s *Service) activeCount(ctx context.Context, roomID primitive.ObjectID) (int64, error) {
	return s.participants.CountDocuments(ctx, bson.M{
		"room_id": roomID,
		"left_at": nil,
	})
}

func (s *Service) checkRoomPassword(room models.Room, plain string) error {
	if room.PasswordHash == "" {
		return nil
	}
	ok, err := password.Verify(room.PasswordHash, plain)
	if err != nil || !ok {
		return ErrWrongPassword
	}
	return nil
}

// SyncDisplayNameForSession updates active room rows when the guest renames in the header.
func (s *Service) SyncDisplayNameForSession(ctx context.Context, sessionID primitive.ObjectID, displayName string) error {
	_, err := s.participants.UpdateMany(ctx, bson.M{
		"session_id": sessionID,
		"left_at":    nil,
	}, bson.M{
		"$set": bson.M{"display_name": displayName},
	})
	return err
}

// PruneStaleParticipants marks participants as left when their session expired or was revoked.
func (s *Service) PruneStaleParticipants(ctx context.Context, roomID primitive.ObjectID) error {
	cur, err := s.participants.Find(ctx, bson.M{
		"room_id": roomID,
		"left_at": nil,
	})
	if err != nil {
		return err
	}
	defer cur.Close(ctx)

	now := time.Now().UTC()
	var stale []primitive.ObjectID
	for cur.Next(ctx) {
		var p models.RoomParticipant
		if err := cur.Decode(&p); err != nil {
			return err
		}
		err := s.sessions.FindOne(ctx, bson.M{
			"_id":        p.SessionID,
			"revoked_at": nil,
			"expires_at": bson.M{"$gt": now},
		}).Err()
		if errors.Is(err, mongo.ErrNoDocuments) {
			stale = append(stale, p.ID)
		} else if err != nil {
			return err
		}
	}
	if len(stale) == 0 {
		return nil
	}
	_, err = s.participants.UpdateMany(ctx, bson.M{
		"_id": bson.M{"$in": stale},
	}, bson.M{
		"$set": bson.M{"left_at": now},
	})
	if err != nil {
		return err
	}
	_, _ = s.tryDeleteRoomIfEmpty(ctx, roomID)
	return nil
}

func (s *Service) syncParticipantDisplayName(ctx context.Context, part models.RoomParticipant, sess session.Session) (models.RoomParticipant, error) {
	displayName, err := s.displayName(ctx, sess)
	if err != nil {
		return part, err
	}
	if part.DisplayName == displayName {
		return part, nil
	}
	_, err = s.participants.UpdateOne(ctx, bson.M{"_id": part.ID}, bson.M{
		"$set": bson.M{"display_name": displayName},
	})
	if err != nil {
		return part, err
	}
	part.DisplayName = displayName
	return part, nil
}

func (s *Service) displayName(ctx context.Context, sess session.Session) (string, error) {
	if sess.IsGuest {
		if sess.GuestDisplayName == "" {
			return "", errors.New("visitante sem nome")
		}
		return sess.GuestDisplayName, nil
	}
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"_id": sess.UserID, "deleted_at": nil}).Decode(&user)
	if err != nil {
		return "", errors.New("usuário não encontrado")
	}
	return user.DisplayName, nil
}

func slugify(name string) string {
	s := strings.ToLower(name)
	s = strings.ReplaceAll(s, " ", "-")
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		}
	}
	return strings.Trim(b.String(), "-")
}

func randomSuffix(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)[:n]
}

func randomInviteCode() (string, error) {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return strings.ToUpper(hex.EncodeToString(b)), nil
}

func (s *Service) SetBroadcastActive(ctx context.Context, roomID primitive.ObjectID, active bool) error {
	now := time.Now().UTC()
	set := bson.M{
		"broadcast_active": active,
		"updated_at":       now,
	}
	unset := bson.M{}
	if !active {
		unset["preview_jpeg"] = ""
		unset["preview_updated_at"] = ""
	}
	update := bson.M{"$set": set}
	if len(unset) > 0 {
		update["$unset"] = unset
	}
	res, err := s.rooms.UpdateOne(ctx, bson.M{
		"_id":    roomID,
		"status": models.StatusActive,
	}, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) SavePreviewJPEG(ctx context.Context, roomID primitive.ObjectID, jpeg []byte) error {
	if len(jpeg) == 0 || len(jpeg) > maxPreviewJPEGBytes {
		return ErrInvalidPreview
	}
	now := time.Now().UTC()
	res, err := s.rooms.UpdateOne(ctx, bson.M{
		"_id":    roomID,
		"status": models.StatusActive,
	}, bson.M{
		"$set": bson.M{
			"preview_jpeg":       jpeg,
			"preview_updated_at": now,
			"broadcast_active":   true,
			"updated_at":         now,
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) PublicCoverJPEG(ctx context.Context, roomID primitive.ObjectID) ([]byte, error) {
	var room models.Room
	err := s.rooms.FindOne(ctx, bson.M{
		"_id":        roomID,
		"status":     models.StatusActive,
		"visibility": models.VisibilityPublic,
	}).Decode(&room)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if !previewFresh(room.PreviewUpdatedAt, room.PreviewJPEG) {
		return nil, ErrNotFound
	}
	return room.PreviewJPEG, nil
}
