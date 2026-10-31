package auth

import "testing"

func TestNormalizeGuestProfilePaths(t *testing.T) {
	t.Parallel()
	name, avatar, errMsg := (&Handler{}).normalizeGuestProfile("Guest", "")
	if errMsg != "" {
		t.Fatalf("unexpected error: %s", errMsg)
	}
	if name != DefaultGuestDisplayName {
		t.Fatalf("name = %q", name)
	}
	if avatar != DefaultGuestAvatarPath {
		t.Fatalf("avatar = %q", avatar)
	}

	_, avatar2, errMsg2 := (&Handler{}).normalizeGuestProfile("Ana", "/media/default-guest-avatar.gif")
	if errMsg2 != "" {
		t.Fatalf("media path: %s", errMsg2)
	}
	if avatar2 != DefaultGuestAvatarPath {
		t.Fatalf("avatar2 = %q", avatar2)
	}

	_, _, errMsg3 := (&Handler{}).normalizeGuestProfile("Ana", "ftp://bad.example/x")
	if errMsg3 == "" {
		t.Fatal("expected validation error for ftp URL")
	}
}
