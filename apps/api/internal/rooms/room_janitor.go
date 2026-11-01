package rooms

import (
	"context"
	"log/slog"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

const emptyRoomJanitorInterval = 30 * time.Second

// StartEmptyRoomJanitor periodically syncs WS presence and deletes empty rooms.
func (s *Service) StartEmptyRoomJanitor(ctx context.Context) {
	go func() {
		s.runEmptyRoomJanitorPass(context.Background())
		ticker := time.NewTicker(emptyRoomJanitorInterval)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.runEmptyRoomJanitorPass(context.Background())
			}
		}
	}()
}

func (s *Service) runEmptyRoomJanitorPass(ctx context.Context) {
	if s.presence != nil {
		s.presence.SyncWithHub(ctx)
	}
	cur, err := s.rooms.Find(ctx, bson.M{
		"status": models.StatusActive,
	}, options.Find().SetProjection(bson.M{"_id": 1}).SetLimit(200))
	if err != nil {
		slog.Warn("empty room janitor: list rooms", "err", err)
		return
	}
	defer cur.Close(ctx)

	for cur.Next(ctx) {
		var row struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cur.Decode(&row); err != nil {
			continue
		}
		if err := s.PruneStaleParticipants(ctx, row.ID); err != nil {
			continue
		}
		deleted, err := s.tryDeleteRoomIfEmpty(ctx, row.ID)
		if err != nil {
			slog.Warn("empty room janitor: purge", "room_id", row.ID.Hex(), "err", err)
			continue
		}
		if deleted {
			slog.Info("empty room janitor: removed room", "room_id", row.ID.Hex())
		}
	}
}
