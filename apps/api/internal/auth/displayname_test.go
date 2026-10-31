package auth

import "testing"

func TestIsReservedDisplayName(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name  string
		input string
		want  bool
	}{
		{"brand", "V0x Live", true},
		{"case", "v0x live", true},
		{"normal", "Ana", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := IsReservedDisplayName(tc.input); got != tc.want {
				t.Fatalf("IsReservedDisplayName(%q) = %v, want %v", tc.input, got, tc.want)
			}
		})
	}
}
