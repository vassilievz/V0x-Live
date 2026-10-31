package middleware

import (
	"net"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"
)

func TestRateLimiterBlocksBurst(t *testing.T) {
	rl := NewRateLimiter(1, 1, false, 100, time.Minute)
	handler := rl.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.10:1234"

	rec1 := httptest.NewRecorder()
	handler.ServeHTTP(rec1, req)
	if rec1.Code != http.StatusOK {
		t.Fatalf("first request: %d", rec1.Code)
	}

	rec2 := httptest.NewRecorder()
	handler.ServeHTTP(rec2, req)
	if rec2.Code != http.StatusTooManyRequests {
		t.Fatalf("second request: got %d want 429", rec2.Code)
	}
}

func TestClientIPIgnoresXFFWhenTrustProxyFalse(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.10:1234"
	req.Header.Set("X-Forwarded-For", "198.51.100.1")
	if ip := clientIP(req, false); ip != "203.0.113.10" {
		t.Fatalf("got %q", ip)
	}
}

func TestClientIPUsesXFFWhenTrustProxyTrue(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "203.0.113.10:1234"
	req.Header.Set("X-Forwarded-For", "198.51.100.1, 10.0.0.1")
	if ip := clientIP(req, true); ip != "198.51.100.1" {
		t.Fatalf("got %q", ip)
	}
}

func TestRateLimiterEvictsStaleVisitors(t *testing.T) {
	ttl := 20 * time.Millisecond
	rl := NewRateLimiter(100, 100, false, 2, ttl)
	rl.mu.Lock()
	rl.visitors["1.1.1.1"] = visitorEntry{lastSeen: time.Now().Add(-time.Hour)}
	rl.visitors["2.2.2.2"] = visitorEntry{lastSeen: time.Now().Add(-time.Hour)}
	rl.mu.Unlock()

	rl.get("3.3.3.3")

	rl.mu.Lock()
	defer rl.mu.Unlock()
	if len(rl.visitors) > 2 {
		t.Fatalf("expected eviction, map size %d", len(rl.visitors))
	}
}

func TestRateLimiterConcurrentGet(t *testing.T) {
	rl := NewRateLimiter(50, 50, false, 1000, time.Minute)
	var wg sync.WaitGroup
	for i := 0; i < 32; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			ip := net.IPv4(203, 0, 113, byte(n%254+1)).String()
			_ = rl.get(ip)
		}(i)
	}
	wg.Wait()
}
