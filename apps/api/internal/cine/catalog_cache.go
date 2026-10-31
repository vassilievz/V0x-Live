package cine

import (
	"sync"
	"time"
)

type ttlCache struct {
	ttl     time.Duration
	mu      sync.RWMutex
	entries map[string]cacheEntry
}

type cacheEntry struct {
	value     any
	expiresAt time.Time
}

func newTTLCache(ttl time.Duration) *ttlCache {
	return &ttlCache{
		ttl:     ttl,
		entries: make(map[string]cacheEntry),
	}
}

func (c *ttlCache) get(key string) (any, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.entries[key]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.value, true
}

func (c *ttlCache) set(key string, value any) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = cacheEntry{
		value:     value,
		expiresAt: time.Now().Add(c.ttl),
	}
}
