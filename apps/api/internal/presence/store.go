package presence

import (
	"sync"
	"time"
)

// Store tracks active site sessions in memory (distinct session_id with TTL).
type Store struct {
	mu   sync.Mutex
	ttl  time.Duration
	last map[string]time.Time
}

func NewStore(ttl time.Duration) *Store {
	if ttl <= 0 {
		ttl = 90 * time.Second
	}
	return &Store{
		ttl:  ttl,
		last: make(map[string]time.Time),
	}
}

func (s *Store) Touch(sessionID string) {
	if sessionID == "" {
		return
	}
	now := time.Now()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.last[sessionID] = now
	s.purgeLocked(now)
}

func (s *Store) Count() int {
	now := time.Now()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.purgeLocked(now)
	return len(s.last)
}

func (s *Store) purgeLocked(now time.Time) {
	cutoff := now.Add(-s.ttl)
	for id, seen := range s.last {
		if seen.Before(cutoff) {
			delete(s.last, id)
		}
	}
}
