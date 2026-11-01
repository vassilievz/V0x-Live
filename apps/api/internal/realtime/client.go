package realtime

import (
	"context"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 15 * time.Second
	pingPeriod     = 10 * time.Second
	maxMessageSize = 4096
	sendBuffer     = 64
)

type Client struct {
	hub       *Hub
	roomID    string
	sessionID primitive.ObjectID
	conn      *websocket.Conn
	send      chan []byte
}

func NewClient(hub *Hub, roomID string, sessionID primitive.ObjectID, conn *websocket.Conn) *Client {
	return &Client{
		hub:       hub,
		roomID:    roomID,
		sessionID: sessionID,
		conn:      conn,
		send:      make(chan []byte, sendBuffer),
	}
}

func (c *Client) TrySend(data []byte) {
	select {
	case c.send <- data:
	default:
	}
}

func (c *Client) Run(ctx context.Context) {
	c.hub.Register(c.roomID, c)
	defer func() {
		c.hub.Unregister(c.roomID, c)
		_ = c.conn.Close()
	}()

	go c.writePump()
	c.readPump(ctx)
}

func (c *Client) readPump(ctx context.Context) {
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		if _, _, err := c.conn.ReadMessage(); err != nil {
			return
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()
	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
