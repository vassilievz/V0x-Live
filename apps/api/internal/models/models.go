package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	VisibilityPublic  = "public"
	VisibilityPrivate = "private"
	StatusActive      = "active"
	StatusClosed      = "closed"
	RoleHost          = "host"
	RoleModerator     = "moderator"
	RoleParticipant   = "participant"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty"`
	Email        string             `bson:"email"`
	PasswordHash string             `bson:"password_hash,omitempty"`
	GoogleID     string             `bson:"google_id,omitempty"`
	DisplayName  string             `bson:"display_name"`
	AvatarURL    string             `bson:"avatar_url,omitempty"`
	CreatedAt    time.Time          `bson:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at"`
	DeletedAt    *time.Time         `bson:"deleted_at,omitempty"`
}

type UserSession struct {
	ID               primitive.ObjectID  `bson:"_id,omitempty"`
	UserID           *primitive.ObjectID `bson:"user_id,omitempty"`
	TokenHash        string              `bson:"token_hash"`
	IsGuest          bool                `bson:"is_guest"`
	GuestDisplayName string              `bson:"guest_display_name,omitempty"`
	GuestAvatarURL   string              `bson:"guest_avatar_url,omitempty"`
	ExpiresAt        time.Time           `bson:"expires_at"`
	CreatedAt        time.Time           `bson:"created_at"`
	RevokedAt        *time.Time          `bson:"revoked_at,omitempty"`
}

type Room struct {
	ID              primitive.ObjectID  `bson:"_id,omitempty"`
	Name            string              `bson:"name"`
	Slug            string              `bson:"slug"`
	Description     string              `bson:"description,omitempty"`
	InviteCode      string              `bson:"invite_code"`
	Visibility      string              `bson:"visibility"`
	PasswordHash    string              `bson:"password_hash,omitempty"`
	OwnerID         *primitive.ObjectID `bson:"owner_id,omitempty"`
	MaxParticipants int                 `bson:"max_participants"`
	Status          string              `bson:"status"`
	CreatedAt       time.Time           `bson:"created_at"`
	UpdatedAt       time.Time           `bson:"updated_at"`
	ClosedAt        *time.Time          `bson:"closed_at,omitempty"`
	BroadcastActive bool                `bson:"broadcast_active,omitempty"`
	PreviewJPEG     []byte              `bson:"preview_jpeg,omitempty"`
	PreviewUpdatedAt time.Time          `bson:"preview_updated_at,omitempty"`
}

type RoomParticipant struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty"`
	RoomID       primitive.ObjectID  `bson:"room_id"`
	UserID       *primitive.ObjectID `bson:"user_id,omitempty"`
	SessionID    primitive.ObjectID  `bson:"session_id"`
	DisplayName  string              `bson:"display_name"`
	Role         string              `bson:"role"`
	CanPublish   bool                `bson:"can_publish"`
	Muted        bool                `bson:"muted"`
	JoinedAt     time.Time           `bson:"joined_at"`
	LeftAt       *time.Time          `bson:"left_at,omitempty"`
}

type ChatMessage struct {
	ID                primitive.ObjectID `bson:"_id,omitempty"`
	RoomID            primitive.ObjectID `bson:"room_id"`
	SenderSessionID   primitive.ObjectID `bson:"sender_session_id"`
	SenderDisplayName string             `bson:"sender_display_name"`
	Body              string             `bson:"body"`
	CreatedAt         time.Time          `bson:"created_at"`
}

type RoomMusic struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty"`
	RoomID              primitive.ObjectID `bson:"room_id"`
	Platform            string             `bson:"platform"`
	VideoID             string             `bson:"video_id,omitempty"`
	PlaylistID          string             `bson:"playlist_id,omitempty"`
	SourceURL           string             `bson:"source_url"`
	Title               string             `bson:"title"`
	AuthorName          string             `bson:"author_name,omitempty"`
	ThumbnailURL        string             `bson:"thumbnail_url,omitempty"`
	ControlMode         string             `bson:"control_mode"`
	ControllerSessionID primitive.ObjectID `bson:"controller_session_id"`
	AddedByName         string             `bson:"added_by_name"`
	Playing             bool               `bson:"playing"`
	PositionSec         float64            `bson:"position_sec"`
	StateAt             time.Time          `bson:"state_at"`
	UpdatedAt           time.Time          `bson:"updated_at"`
}

type PasswordReset struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id"`
	TokenHash string             `bson:"token_hash"`
	ExpiresAt time.Time          `bson:"expires_at"`
	UsedAt    *time.Time         `bson:"used_at,omitempty"`
	CreatedAt time.Time          `bson:"created_at"`
}
