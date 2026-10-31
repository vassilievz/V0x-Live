package realtime

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
)

type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{rooms: make(map[string]map[*Client]struct{})}
}

func (h *Hub) Register(roomID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]struct{})
	}
	h.rooms[roomID][c] = struct{}{}
}

func (h *Hub) Unregister(roomID string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clients, ok := h.rooms[roomID]; ok {
		delete(clients, c)
		if len(clients) == 0 {
			delete(h.rooms, roomID)
		}
	}
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
