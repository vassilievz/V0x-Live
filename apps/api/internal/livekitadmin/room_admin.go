package livekitadmin

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"

	"github.com/v0xlive/v0x-live/apps/api/internal/config"
)

const adminTimeout = 3 * time.Second

// RoomAdmin wraps LiveKit RoomService for server-side participant eviction.
type RoomAdmin struct {
	client *lksdk.RoomServiceClient
}

func NewRoomAdmin(cfg config.Config) *RoomAdmin {
	if strings.TrimSpace(cfg.LiveKitAPIKey) == "" || strings.TrimSpace(cfg.LiveKitAPISecret) == "" {
		return &RoomAdmin{}
	}
	host := apiHost(cfg.LiveKitURL)
	if host == "" {
		return &RoomAdmin{}
	}
	return &RoomAdmin{
		client: lksdk.NewRoomServiceClient(host, cfg.LiveKitAPIKey, cfg.LiveKitAPISecret),
	}
}

func apiHost(livekitURL string) string {
	u := strings.TrimSpace(livekitURL)
	if u == "" {
		return ""
	}
	u = strings.Replace(u, "wss://", "https://", 1)
	u = strings.Replace(u, "ws://", "http://", 1)
	return u
}

// RemoveParticipant disconnects a session from LiveKit (best-effort, async).
func (a *RoomAdmin) RemoveParticipant(roomName, identity string) {
	if a.client == nil || roomName == "" || identity == "" {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), adminTimeout)
		defer cancel()
		_, err := a.client.RemoveParticipant(ctx, &livekit.RoomParticipantIdentity{
			Room:     roomName,
			Identity: identity,
		})
		if err != nil {
			slog.Debug("livekit remove participant", "room", roomName, "identity", identity, "err", err)
		}
	}()
}

// DeleteRoom tears down the LiveKit room and all tracks (best-effort, async).
func (a *RoomAdmin) DeleteRoom(roomName string) {
	if a.client == nil || roomName == "" {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), adminTimeout)
		defer cancel()
		_, err := a.client.DeleteRoom(ctx, &livekit.DeleteRoomRequest{Room: roomName})
		if err != nil {
			slog.Debug("livekit delete room", "room", roomName, "err", err)
		}
	}()
}
