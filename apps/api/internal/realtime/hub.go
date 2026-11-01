package realtime

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
)

type Hub struct {
	mu       sync.RWMutex
	rooms    map[string]map[*Client]struct{}
	handlers sessionHandlers
}

func NewHub() *Hub {
	return &Hub{rooms: make(map[string]map[*Client]struct{})}
}

func (h *Hub) Register(roomID string, c *Client) {
	h.registerClient(roomID, c)
}

func (h *Hub) Unregister(roomID string, c *Client) {
	_ = roomID
	h.unregisterClient(c)
}

func (h *Hub) Broadcast(roomID string, event Event) {
	data, err := json.Marshal(event)
	if err != nil {
		slog.Error("broadcast marshal", "err", err)
		return
	}
	h.mu.RLock()
	clients := h.rooms[roomID]
	snapshot := make([]*Client, 0, len(clients))
	for c := range clients {
		snapshot = append(snapshot, c)
	}
	h.mu.RUnlock()

	for _, c := range snapshot {
		c.TrySend(data)
	}
}

func (h *Hub) Publish(ctx context.Context, roomID string, eventType string, payload any) {
	_ = ctx
	ev, err := NewEvent(eventType, payload)
	if err != nil {
		slog.Error("publish event", "err", err)
		return
	}
	h.Broadcast(roomID, ev)
}
