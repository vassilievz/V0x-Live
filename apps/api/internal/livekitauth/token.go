package livekitauth

import (
	"fmt"
	"time"

	"github.com/livekit/protocol/auth"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

// TokenPayload is returned to clients for LiveKit room connection.
type TokenPayload struct {
	Token    string `json:"token"`
	URL      string `json:"url"`
	RoomName string `json:"room_name"`
	Identity string `json:"identity"`
}

// MintParticipantToken builds a JWT for an active room participant.
func MintParticipantToken(
	cfg config.Config,
	roomID primitive.ObjectID,
	sessID primitive.ObjectID,
	part models.RoomParticipant,
) (TokenPayload, error) {
	canPublish := part.CanPublish && !part.Muted
	roomName := roomID.Hex()
	identity := sessID.Hex()

	at := auth.NewAccessToken(cfg.LiveKitAPIKey, cfg.LiveKitAPISecret)
	canPub := canPublish
	canSub := true
	grant := &auth.VideoGrant{
		RoomJoin:     true,
		Room:         roomName,
		CanPublish:   &canPub,
		CanSubscribe: &canSub,
	}
	at.SetIdentity(identity).
		SetName(part.DisplayName).
		SetValidFor(15 * time.Minute).
		AddGrant(grant)

	jwt, err := at.ToJWT()
	if err != nil {
		return TokenPayload{}, fmt.Errorf("livekit jwt: %w", err)
	}

	return TokenPayload{
		Token:    jwt,
		URL:      cfg.LiveKitURL,
		RoomName: roomName,
		Identity: identity,
	}, nil
}
