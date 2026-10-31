package chat

import "testing"

func TestSanitize_stripsAngles(t *testing.T) {
	in := "  hello <script>alert(1)</script> world  "
	got := Sanitize(in)
	if got != "hello scriptalert(1)/script world" {
		t.Fatalf("got %q", got)
	}
}
