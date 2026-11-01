package livekitadmin

import "testing"

func TestAPIHost(t *testing.T) {
	t.Parallel()
	tests := []struct {
		in   string
		want string
	}{
		{"ws://localhost:7880", "http://localhost:7880"},
		{"wss://live.example.com", "https://live.example.com"},
		{"http://127.0.0.1:7880", "http://127.0.0.1:7880"},
		{"", ""},
	}
	for _, tc := range tests {
		if got := apiHost(tc.in); got != tc.want {
			t.Fatalf("apiHost(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}
