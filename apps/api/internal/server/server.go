package server

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/v0xlive/v0x-live/apps/api/internal/auth"
	"github.com/v0xlive/v0x-live/apps/api/internal/auth/session"
	"github.com/v0xlive/v0x-live/apps/api/internal/chat"
	"github.com/v0xlive/v0x-live/apps/api/internal/cine"
	"github.com/v0xlive/v0x-live/apps/api/internal/config"
	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/health"
	apimw "github.com/v0xlive/v0x-live/apps/api/internal/middleware"
	"github.com/v0xlive/v0x-live/apps/api/internal/music"
	"github.com/v0xlive/v0x-live/apps/api/internal/presence"
	"github.com/v0xlive/v0x-live/apps/api/internal/realtime"
	"github.com/v0xlive/v0x-live/apps/api/internal/rooms"
	"github.com/v0xlive/v0x-live/apps/api/internal/streaming"
)

const version = "0.2.0"

type Server struct {
	cfg   config.Config
	store *database.Store
	http  *http.Server
}

func New(cfg config.Config, store *database.Store) *Server {
	sessions := session.NewManager(store, cfg.SessionCookieName, cfg.SessionCookieDomain, cfg.SessionMaxAge, cfg.SecureCookies())
	hub := realtime.NewHub()
	roomSvc := rooms.NewService(store)
	roomSvc.StartEmptyRoomJanitor(context.Background())

	authHandler := auth.NewHandler(sessions, roomSvc, auth.NewUserRepository(store.Collection("users")), cfg)
	roomHandler := rooms.NewHandler(roomSvc, hub, cfg)
	chatHandler := chat.NewHandler(store, roomSvc, hub)
	musicHandler := music.NewHandler(store, roomSvc, hub)
	cineCatalogSvc := cine.NewCatalogService()
	cineCatalogSvc.StartBackgroundWarmup()
	cineHandler := cine.NewHandler(store, roomSvc, hub, cineCatalogSvc)
	cineCatalogHandler := cine.NewCatalogHandler(cineCatalogSvc)
	cineCatalogLimiter := apimw.NewRateLimiter(3, 8, cfg.TrustProxy, cfg.RateLimitMaxIPs, cfg.RateLimitVisitorTTL)
	streamHandler := streaming.NewHandler(cfg, roomSvc)
	realtimeHandler := realtime.NewHandler(hub, sessions, roomSvc, cfg)
	healthHandler := health.NewHandler(store, version)
	presenceStore := presence.NewStore(90 * time.Second)
	presenceHandler := presence.NewHandler(presenceStore)
	limiter := apimw.NewRateLimiter(cfg.RateLimitRPS, cfg.RateLimitBurst, cfg.TrustProxy, cfg.RateLimitMaxIPs, cfg.RateLimitVisitorTTL)
	guestLimiter := apimw.NewRateLimiter(cfg.AuthGuestRPS, cfg.AuthGuestBurst, cfg.TrustProxy, cfg.RateLimitMaxIPs, cfg.RateLimitVisitorTTL)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(apimw.SecurityHeaders(cfg.SecureCookies()))
	r.Use(limiter.Middleware)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", healthHandler.Health)
	r.Get("/ready", healthHandler.Ready)

	r.Route("/api/v1", func(api chi.Router) {
		// WebSocket must not use chi Timeout (hijacked connection).
		api.With(auth.RequireSession(sessions)).Get("/realtime/ws", realtimeHandler.ServeWS)

		api.Group(func(api chi.Router) {
			api.Use(middleware.Timeout(120 * time.Second))

			api.Route("/auth", func(ar chi.Router) {
				authHandler.RegisterRoutes(ar, guestLimiter.Middleware)
			})
			api.Get("/stats/online", presenceHandler.OnlineCount)
			api.With(auth.RequireSession(sessions)).Post("/presence/heartbeat", presenceHandler.Heartbeat)

			api.Route("/cine", func(cr chi.Router) {
				cr.Use(auth.RequireSession(sessions))
				cr.Use(cineCatalogLimiter.Middleware)
				cineCatalogHandler.RegisterRoutes(cr)
			})

			api.Route("/rooms", func(rr chi.Router) {
				roomHandler.RegisterPublic(rr)
				rr.Group(func(pr chi.Router) {
					pr.Use(auth.RequireSession(sessions))
					roomHandler.RegisterProtected(pr)
					chatHandler.RegisterRoutes(pr)
					musicHandler.RegisterRoutes(pr)
					cineHandler.RegisterRoutes(pr)
					streamHandler.RegisterRoutes(pr)
				})
			})
		})
	})

	s := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 0,
		IdleTimeout:  120 * time.Second,
	}

	return &Server{cfg: cfg, store: store, http: s}
}

func (s *Server) ListenAndServe() error {
	slog.Info("api listening", "addr", s.cfg.HTTPAddr, "env", s.cfg.Env)
	return s.http.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.http.Shutdown(ctx)
}
