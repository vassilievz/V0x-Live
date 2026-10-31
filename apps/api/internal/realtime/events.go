package realtime

import "encoding/json"

type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewEvent(eventType string, payload any) (Event, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return Event{}, err
	}
	return Event{Type: eventType, Payload: raw}, nil
}

const (
	EventParticipantJoined = "room.participant.joined"
	EventParticipantLeft   = "room.participant.left"
	EventRoomUpdated         = "room.updated"
	EventRoomClosed          = "room.closed"
	EventChatMessage         = "chat.message.created"
	EventParticipantMuted    = "participant.muted"
	EventScreenStarted       = "participant.screen_started"
	EventScreenStopped       = "participant.screen_stopped"
	EventRoomMusicUpdated    = "room.music.updated"
	EventRoomCineUpdated     = "room.cine.updated"
)
