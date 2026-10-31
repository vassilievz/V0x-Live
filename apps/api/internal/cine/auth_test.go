package cine

import (
	"testing"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
	"github.com/v0xlive/v0x-live/apps/api/internal/music"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestIsRoomHostOwner_requiresHostRole(t *testing.T) {
	roomID := primitive.NewObjectID()
	ownerID := primitive.NewObjectID()
	otherUser := primitive.NewObjectID()

	room := models.Room{ID: roomID, OwnerID: &ownerID}
	partGuest := models.RoomParticipant{Role: models.RoleParticipant, UserID: &ownerID}
	partHostWrongUser := models.RoomParticipant{Role: models.RoleHost, UserID: &otherUser}
	partHostOwner := models.RoomParticipant{Role: models.RoleHost, UserID: &ownerID}

	if isRoomHostOwnerWithRoom(room, &partGuest) {
		t.Fatal("guest must not control cine")
	}
	if isRoomHostOwnerWithRoom(room, &partHostWrongUser) {
		t.Fatal("host with different user id must not control when owner_id set")
	}
	if !isRoomHostOwnerWithRoom(room, &partHostOwner) {
		t.Fatal("room owner host must control cine")
	}

	roomNoOwner := models.Room{ID: roomID, OwnerID: nil}
	partHost := models.RoomParticipant{Role: models.RoleHost, UserID: &otherUser}
	if !isRoomHostOwnerWithRoom(roomNoOwner, &partHost) {
		t.Fatal("host must control when room has no owner_id")
	}
}

func isRoomHostOwnerWithRoom(room models.Room, part *models.RoomParticipant) bool {
	if part == nil || part.Role != models.RoleHost {
		return false
	}
	if room.OwnerID == nil {
		return true
	}
	if part.UserID == nil {
		return false
	}
	return part.UserID.Hex() == room.OwnerID.Hex()
}

func TestParseDirectMediaURL_cineContract(t *testing.T) {
	presigned := "https://cdn.example.com/v/file.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=x"
	got, ok := music.ParseDirectMediaURL(presigned)
	if !ok || got.MediaType != "mp4" {
		t.Fatalf("expected mp4 presigned ok, got %+v ok=%v", got, ok)
	}

	hls := "https://cdn.example.com/live/playlist.m3u8?token=abc"
	got, ok = music.ParseDirectMediaURL(hls)
	if !ok || got.MediaType != "hls" {
		t.Fatalf("expected hls ok, got %+v", got)
	}

	if _, ok := music.ParseDirectMediaURL("http://evil.com/v.mp4"); ok {
		t.Fatal("http must be rejected")
	}
	if _, ok := music.ParseDirectMediaURL("https://youtube.com/watch?v=abc"); ok {
		t.Fatal("page url must be rejected")
	}
}
