package rooms

import (
	"testing"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

func TestCanDirectJoin(t *testing.T) {
	t.Parallel()
	tests := []struct {
		visibility string
		want       bool
	}{
		{models.VisibilityPublic, true},
		{models.VisibilityPrivate, false},
		{"", true},
	}
	for _, tc := range tests {
		room := models.Room{Visibility: tc.visibility}
		if got := CanDirectJoin(room); got != tc.want {
			t.Fatalf("visibility=%q: got %v want %v", tc.visibility, got, tc.want)
		}
	}
}
