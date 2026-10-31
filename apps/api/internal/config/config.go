package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Env                string
	HTTPAddr           string
	MongoURL           string
	SessionCookieName  string
	SessionCookieDomain string
	SessionMaxAge      time.Duration
	CORSAllowedOrigins []string
	TrustProxy         bool
	RateLimitRPS       int
	RateLimitBurst     int
	AuthGuestRPS       int
	AuthGuestBurst     int
	RateLimitMaxIPs    int
	RateLimitVisitorTTL time.Duration
	LiveKitURL         string
	LiveKitAPIKey      string
	LiveKitAPISecret   string
	AppPublicURL       string
}

func Load() (Config, error) {
	_ = godotenv.Load()
	_ = godotenv.Load(".env")

	mongoURL := strings.TrimSpace(os.Getenv("MONGO_URL"))
	if mongoURL == "" {
		mongoURL = strings.TrimSpace(os.Getenv("MONGODB_URI"))
	}
	if mongoURL == "" {
		return Config{}, fmt.Errorf("MONGO_URL é obrigatório (copie apps/api/.env.example para .env)")
	}

	httpAddr := getEnv("HTTP_ADDR", ":8080")
	if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
		httpAddr = ":" + port
	}

	cfg := Config{
		Env:                getEnv("APP_ENV", "development"),
		HTTPAddr:           httpAddr,
		MongoURL:           mongoURL,
		SessionCookieName:  getEnv("SESSION_COOKIE_NAME", "v0x_session"),
		SessionCookieDomain: strings.TrimSpace(getEnv("SESSION_COOKIE_DOMAIN", "")),
		SessionMaxAge:      7 * 24 * time.Hour,
		CORSAllowedOrigins: splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")),
		TrustProxy:         strings.EqualFold(getEnv("TRUST_PROXY", "false"), "true"),
		RateLimitRPS:       getEnvInt("RATE_LIMIT_RPS", 120),
		RateLimitBurst:     getEnvInt("RATE_LIMIT_BURST", 180),
		AuthGuestRPS:       getEnvInt("AUTH_GUEST_RATE_RPS", 8),
		AuthGuestBurst:     getEnvInt("AUTH_GUEST_RATE_BURST", 12),
		RateLimitMaxIPs:    getEnvInt("RATE_LIMIT_MAX_IPS", 10_000),
		RateLimitVisitorTTL: time.Duration(getEnvInt("RATE_LIMIT_VISITOR_TTL_MIN", 15)) * time.Minute,
		LiveKitURL:         getEnv("LIVEKIT_URL", "ws://localhost:7880"),
		LiveKitAPIKey:      getEnv("LIVEKIT_API_KEY", "devkey"),
		LiveKitAPISecret:   getEnv("LIVEKIT_API_SECRET", "secret_must_be_at_least_32_characters_long_dev"),
		AppPublicURL:       getEnv("APP_URL", "http://localhost:5173"),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	var n int
	if _, err := fmt.Sscanf(v, "%d", &n); err != nil || n <= 0 {
		return fallback
	}
	return n
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func (c Config) SecureCookies() bool {
	return c.Env == "production"
}
