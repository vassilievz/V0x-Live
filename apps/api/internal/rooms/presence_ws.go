package rooms

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
)

const wsDisconnectGrace = 10 * time.Second
const publicRoomBootstrap = 15 * time.Second

type pendingLeave struct {
	timer *time.Timer
}

// RealtimePresence ties MongoDB membership to live WebSocket connections.
type RealtimePresence struct {
	svc *Service
	hub *realtime.Hub

	mu      sync.Mutex
	pending map[string]pendingLeave

	publishLeft  func(ctx context.Context, roomID, sessionID string)
	publishClosed func(ctx context.Context, roomID primitive.ObjectID)
}

func NewRealtimePresence(
	svc *Service,
	hub *realtime.Hub,
	publishLeft func(context.Context, string, string),
	publishClosed func(context.Context, primitive.ObjectID),
) *RealtimePresence {
	p := &RealtimePresence{
		svc:           svc,
		hub:           hub,
		pending:       make(map[string]pendingLeave),
		publishLeft:   publishLeft,
		publishClosed: publishClosed,
	}
	hub.SetSessionHandlers(p.OnSessionActive, p.OnSessionIdle)
	return p
}

func pendingKey(roomID string, sessionID primitive.ObjectID) string {
	return roomID + ":" + sessionID.Hex()
}

func (p *RealtimePresence) OnSessionActive(roomID string, sessionID primitive.ObjectID) {
	p.cancelPending(roomID, sessionID)
}

func (p *RealtimePresence) OnSessionIdle(roomID string, sessionID primitive.ObjectID) {
	p.scheduleLeave(roomID, sessionID)
}

func (p *RealtimePresence) OnExplicitLeave(roomID string, sessionID primitive.ObjectID) {
	p.cancelPending(roomID, sessionID)
}

func (p *RealtimePresence) cancelPending(roomID string, sessionID primitive.ObjectID) {
	key := pendingKey(roomID, sessionID)
	p.mu.Lock()
	defer p.mu.Unlock()
	if item, ok := p.pending[key]; ok {
		item.timer.Stop()
		delete(p.pending, key)
	}
}

func (p *RealtimePresence) scheduleLeave(roomID string, sessionID primitive.ObjectID) {
	key := pendingKey(roomID, sessionID)
	p.mu.Lock()
	if existing, ok := p.pending[key]; ok {
		existing.timer.Stop()
	}
	timer := time.AfterFunc(wsDisconnectGrace, func() {
		p.mu.Lock()
		delete(p.pending, key)
		p.mu.Unlock()
		if p.hub.SessionConnectionCount(roomID, sessionID) > 0 {
			return
		}
		p.commitLeave(roomID, sessionID)
	})
	p.pending[key] = pendingLeave{timer: timer}
	p.mu.Unlock()
}

func (p *RealtimePresence) commitLeave(roomID string, sessionID primitive.ObjectID) {
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	rid, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return
	}
	deleted, err := p.svc.LeaveBySessionID(ctx, rid, sessionID)
	if err != nil {
		slog.Warn("ws presence: leave session", "room_id", roomID, "session_id", sessionID.Hex(), "err", err)
		return
	}
	if p.publishLeft != nil {
		p.publishLeft(ctx, roomID, sessionID.Hex())
	}
	if deleted && p.publishClosed != nil {
		p.publishClosed(ctx, rid)
	}
}

// SyncWithHub removes Mongo participants with no live socket (outside grace windows).
func (p *RealtimePresence) SyncWithHub(ctx context.Context) {
	rooms, err := p.svc.ListActiveRooms(ctx, 300)
	if err != nil {
		slog.Warn("ws presence sync: list rooms", "err", err)
		return
	}
	for _, room := range rooms {
		roomHex := room.ID.Hex()
		connected := p.hub.ConnectedSessionIDs(roomHex)
		parts, err := p.svc.ListParticipants(ctx, room.ID)
		if err != nil {
			continue
		}
		for _, part := range parts {
			if _, live := connected[part.SessionID]; live {
				continue
			}
			if p.hasPendingLeave(roomHex, part.SessionID) {
				continue
			}
			if time.Since(room.CreatedAt) <= publicRoomBootstrap && len(connected) == 0 {
				continue
			}
			p.commitLeave(roomHex, part.SessionID)
		}
	}
}

func (p *RealtimePresence) PublicParticipantCount(roomID string, roomCreated time.Time, mongoCount int64) int {
	live := p.hub.UniqueSessions(roomID)
	if live > 0 {
		return live
	}
	if time.Since(roomCreated) <= publicRoomBootstrap && mongoCount > 0 {
		return int(mongoCount)
	}
	return 0
}

func (p *RealtimePresence) hasPendingLeave(roomID string, sessionID primitive.ObjectID) bool {
	key := pendingKey(roomID, sessionID)
	p.mu.Lock()
	defer p.mu.Unlock()
	_, ok := p.pending[key]
	return ok
}
