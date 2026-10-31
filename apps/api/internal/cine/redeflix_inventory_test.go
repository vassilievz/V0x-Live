package cine

import (
	"context"
	"fmt"
	"testing"
	"time"
)

func TestRedeFlixInventoryCacheServesStaleOnRefreshFailure(t *testing.T) {
	t.Parallel()
	calls := 0
	cache := newRedeFlixInventoryCache(func(ctx context.Context) (*redeflixInventory, error) {
		_ = ctx
		calls++
		if calls == 1 {
			return &redeflixInventory{movies: []int{42}}, nil
		}
		return nil, fmt.Errorf("upstream unavailable")
	})

	ctx := context.Background()
	inv, err := cache.get(ctx)
	if err != nil || len(inv.movies) != 1 || inv.movies[0] != 42 {
		t.Fatalf("first load: inv=%v err=%v", inv, err)
	}

	cache.mu.Lock()
	cache.expires = time.Now().Add(-time.Minute)
	cache.mu.Unlock()

	stale, err := cache.get(ctx)
	if err != nil {
		t.Fatalf("stale load err: %v", err)
	}
	if len(stale.movies) != 1 || stale.movies[0] != 42 {
		t.Fatalf("stale inv = %+v", stale.movies)
	}
	if calls != 2 {
		t.Fatalf("load calls = %d want 2", calls)
	}
}
