package music

import "testing"

func TestParseYouTubeURL(t *testing.T) {
	tests := []struct {
		in      string
		video   string
		playlist string
		ok      bool
	}{
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ", "", true},
		{"https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ", "", true},
		{"https://youtube.com/playlist?list=PLtest123", "", "PLtest123", true},
		{"not-a-url", "", "", false},
	}
	for _, tc := range tests {
		got, ok := ParseYouTubeURL(tc.in)
		if ok != tc.ok {
			t.Fatalf("%q ok=%v want %v", tc.in, ok, tc.ok)
		}
		if !ok {
			continue
		}
		if got.VideoID != tc.video || got.PlaylistID != tc.playlist {
			t.Fatalf("%q got %+v", tc.in, got)
		}
	}
}
