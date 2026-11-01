package realtime

import (
	"context"
	"sync"

	"github.com/gorilla/websocket"
)

// Shutdown closes every connected client with CloseGoingAway.
func (h *Hub) Shutdown(ctx context.Context) {
	h.mu.RLock()
	snapshot := make([]*Client, 0)
	for _, clients := range h.rooms {
		for c := range clients {
			snapshot = append(snapshot, c)
		}
	}
	h.mu.RUnlock()

	var wg sync.WaitGroup
	for _, c := range snapshot {
		wg.Add(1)
		go func(client *Client) {
			defer wg.Done()
			client.CloseWithCode(websocket.CloseGoingAway, "server_shutdown")
		}(c)
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-ctx.Done():
	case <-done:
	}
}
