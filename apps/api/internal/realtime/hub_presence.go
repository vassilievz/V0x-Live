package realtime

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SessionIdleHandler func(roomID string, sessionID primitive.ObjectID)
type SessionActiveHandler func(roomID string, sessionID primitive.ObjectID)

// Hub tracks live WebSocket connections per room (and session).
type sessionHandlers struct {
	onIdle   SessionIdleHandler
	onActive SessionActiveHandler
}

func (h *Hub) SetSessionHandlers(onActive SessionActiveHandler, onIdle SessionIdleHandler) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.handlers.onActive = onActive
	h.handlers.onIdle = onIdle
}

func (h *Hub) UniqueSessions(roomID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients := h.rooms[roomID]
	if len(clients) == 0 {
		return 0
	}
	seen := make(map[primitive.ObjectID]struct{}, len(clients))
	for c := range clients {
		if c.sessionID.IsZero() {
			continue
		}
		seen[c.sessionID] = struct{}{}
	}
	return len(seen)
}

func (h *Hub) SessionConnectionCount(roomID string, sessionID primitive.ObjectID) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients := h.rooms[roomID]
	if len(clients) == 0 {
		return 0
	}
	n := 0
	for c := range clients {
		if c.sessionID == sessionID {
			n++
		}
	}
	return n
}

func (h *Hub) ActiveRoomIDs() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	out := make([]string, 0, len(h.rooms))
	for roomID, clients := range h.rooms {
		if len(clients) > 0 {
			out = append(out, roomID)
		}
	}
	return out
}

func (h *Hub) ConnectedSessionIDs(roomID string) map[primitive.ObjectID]struct{} {
	h.mu.RLock()
	defer h.mu.RUnlock()
	clients := h.rooms[roomID]
	out := make(map[primitive.ObjectID]struct{}, len(clients))
	for c := range clients {
		if !c.sessionID.IsZero() {
			out[c.sessionID] = struct{}{}
		}
	}
	return out
}

func (h *Hub) registerClient(roomID string, c *Client) {
	var onActive SessionActiveHandler
	h.mu.Lock()
	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]struct{})
	}
	h.rooms[roomID][c] = struct{}{}
	onActive = h.handlers.onActive
	h.mu.Unlock()
	if onActive != nil && !c.sessionID.IsZero() {
		onActive(roomID, c.sessionID)
	}
}

func (h *Hub) unregisterClient(c *Client) {
	roomID := c.roomID
	sessionID := c.sessionID
	var onIdle SessionIdleHandler
	h.mu.Lock()
	if clients, ok := h.rooms[roomID]; ok {
		delete(clients, c)
		if len(clients) == 0 {
			delete(h.rooms, roomID)
		}
	}
	remaining := 0
	if clients, ok := h.rooms[roomID]; ok {
		for other := range clients {
			if other.sessionID == sessionID {
				remaining++
			}
		}
	}
	if remaining == 0 && !sessionID.IsZero() {
		onIdle = h.handlers.onIdle
	}
	h.mu.Unlock()
	if onIdle != nil {
		onIdle(roomID, sessionID)
	}
}
