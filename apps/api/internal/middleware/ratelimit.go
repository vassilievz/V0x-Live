package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"

	"github.com/v0xlive/v0x-live/apps/api/internal/httpx"
)

type visitorEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	mu         sync.Mutex
	limit      rate.Limit
	burst      int
	trustProxy bool
	maxEntries int
	visitorTTL time.Duration
	visitors   map[string]visitorEntry
}

func NewRateLimiter(rps int, burst int, trustProxy bool, maxEntries int, visitorTTL time.Duration) *RateLimiter {
	if rps <= 0 {
		rps = 100
	}
	if burst <= 0 {
		burst = rps
	}
	if maxEntries <= 0 {
		maxEntries = 10_000
	}
	if visitorTTL <= 0 {
		visitorTTL = 15 * time.Minute
	}
	return &RateLimiter{
		limit:      rate.Limit(rps),
		burst:      burst,
		trustProxy: trustProxy,
		maxEntries: maxEntries,
		visitorTTL: visitorTTL,
		visitors:   make(map[string]visitorEntry),
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r, rl.trustProxy)
		if !rl.get(ip).Allow() {
			w.Header().Set("Retry-After", "1")
			httpx.WriteError(w, http.StatusTooManyRequests, "rate_limited", "Muitas requisições")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (rl *RateLimiter) get(ip string) *rate.Limiter {
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if ent, ok := rl.visitors[ip]; ok {
		ent.lastSeen = now
		rl.visitors[ip] = ent
		return ent.limiter
	}

	rl.evictLocked(now)

	lim := rate.NewLimiter(rl.limit, rl.burst)
	rl.visitors[ip] = visitorEntry{limiter: lim, lastSeen: now}
	return lim
}

func (rl *RateLimiter) evictLocked(now time.Time) {
	if len(rl.visitors) < rl.maxEntries {
		for key, ent := range rl.visitors {
			if now.Sub(ent.lastSeen) > rl.visitorTTL {
				delete(rl.visitors, key)
			}
		}
	}
	for len(rl.visitors) >= rl.maxEntries {
		var oldestKey string
		var oldest time.Time
		first := true
		for key, ent := range rl.visitors {
			if first || ent.lastSeen.Before(oldest) {
				oldestKey = key
				oldest = ent.lastSeen
				first = false
			}
		}
		if oldestKey == "" {
			break
		}
		delete(rl.visitors, oldestKey)
	}
}

func clientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			return strings.TrimSpace(parts[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
