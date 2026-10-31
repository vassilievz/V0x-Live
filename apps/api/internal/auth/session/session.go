package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/v0xlive/v0x-live/apps/api/internal/database"
	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

var ErrUnauthorized = errors.New("unauthorized")

type Session struct {
	ID               primitive.ObjectID
	UserID           *primitive.ObjectID
	IsGuest          bool
	GuestDisplayName string
	GuestAvatarURL   string
	ExpiresAt        time.Time
}

type Manager struct {
	sessions     *mongo.Collection
	cookieName   string
	cookieDomain string
	maxAge       time.Duration
	secure       bool
}

func NewManager(store *database.Store, cookieName string, cookieDomain string, maxAge time.Duration, secure bool) *Manager {
	return &Manager{
		sessions:     store.Collection("user_sessions"),
		cookieName:   cookieName,
		cookieDomain: cookieDomain,
		maxAge:       maxAge,
		secure:       secure,
	}
}

func (m *Manager) CookieName() string {
	return m.cookieName
}

func (m *Manager) CreateGuest(ctx context.Context, displayName, avatarURL string) (rawToken string, sess Session, err error) {
	rawToken, tokenHash, err := newToken()
	if err != nil {
		return "", Session{}, err
	}
	now := time.Now().UTC()
	doc := models.UserSession{
		TokenHash:        tokenHash,
		IsGuest:          true,
		GuestDisplayName: displayName,
		GuestAvatarURL:   avatarURL,
		ExpiresAt:        now.Add(m.maxAge),
		CreatedAt:        now,
	}
	res, err := m.sessions.InsertOne(ctx, doc)
	if err != nil {
		return "", Session{}, err
	}
	id, _ := res.InsertedID.(primitive.ObjectID)
	sess = Session{
		ID:               id,
		IsGuest:          true,
		GuestDisplayName: displayName,
		GuestAvatarURL:   avatarURL,
		ExpiresAt:        doc.ExpiresAt,
	}
	return rawToken, sess, nil
}

func (m *Manager) CreateForUser(ctx context.Context, userID primitive.ObjectID) (rawToken string, sess Session, err error) {
	rawToken, tokenHash, err := newToken()
	if err != nil {
		return "", Session{}, err
	}
	now := time.Now().UTC()
	uid := userID
	doc := models.UserSession{
		UserID:    &uid,
		TokenHash: tokenHash,
		IsGuest:   false,
		ExpiresAt: now.Add(m.maxAge),
		CreatedAt: now,
	}
	res, err := m.sessions.InsertOne(ctx, doc)
	if err != nil {
		return "", Session{}, err
	}
	id, _ := res.InsertedID.(primitive.ObjectID)
	sess = Session{
		ID:        id,
		UserID:    &uid,
		IsGuest:   false,
		ExpiresAt: doc.ExpiresAt,
	}
	return rawToken, sess, nil
}

func (m *Manager) UpdateGuest(ctx context.Context, id primitive.ObjectID, displayName, avatarURL string) error {
	_, err := m.sessions.UpdateOne(ctx, bson.M{
		"_id":        id,
		"is_guest":   true,
		"revoked_at": nil,
	}, bson.M{
		"$set": bson.M{
			"guest_display_name": displayName,
			"guest_avatar_url":   avatarURL,
		},
	})
	return err
}

func (m *Manager) SetCookie(w http.ResponseWriter, rawToken string) {
	sameSite := http.SameSiteLaxMode
	if m.secure {
		sameSite = http.SameSiteNoneMode
	}
	cookie := &http.Cookie{
		Name:     m.cookieName,
		Value:    rawToken,
		Path:     "/",
		MaxAge:   int(m.maxAge.Seconds()),
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   m.secure,
	}
	if m.cookieDomain != "" {
		cookie.Domain = m.cookieDomain
	}
	http.SetCookie(w, cookie)
}

func (m *Manager) ClearCookie(w http.ResponseWriter) {
	sameSite := http.SameSiteLaxMode
	if m.secure {
		sameSite = http.SameSiteNoneMode
	}
	cookie := &http.Cookie{
		Name:     m.cookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   m.secure,
	}
	if m.cookieDomain != "" {
		cookie.Domain = m.cookieDomain
	}
	http.SetCookie(w, cookie)
}

func (m *Manager) FromRequest(ctx context.Context, r *http.Request) (Session, error) {
	cookie, err := r.Cookie(m.cookieName)
	if err != nil {
		return Session{}, ErrUnauthorized
	}
	return m.FromToken(ctx, cookie.Value)
}

func (m *Manager) FromToken(ctx context.Context, rawToken string) (Session, error) {
	hash := hashToken(rawToken)
	var doc models.UserSession
	err := m.sessions.FindOne(ctx, bson.M{
		"token_hash": hash,
		"revoked_at": nil,
		"expires_at": bson.M{"$gt": time.Now().UTC()},
	}).Decode(&doc)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return Session{}, ErrUnauthorized
		}
		return Session{}, err
	}
	return Session{
		ID:               doc.ID,
		UserID:           doc.UserID,
		IsGuest:          doc.IsGuest,
		GuestDisplayName: doc.GuestDisplayName,
		GuestAvatarURL:   doc.GuestAvatarURL,
		ExpiresAt:        doc.ExpiresAt,
	}, nil
}

func (m *Manager) Revoke(ctx context.Context, rawToken string) error {
	hash := hashToken(rawToken)
	now := time.Now().UTC()
	_, err := m.sessions.UpdateOne(ctx, bson.M{"token_hash": hash}, bson.M{
		"$set": bson.M{"revoked_at": now},
	})
	return err
}

// RevokeOtherGuests invalidates every other active guest session (one browser profile → one guest).
func (m *Manager) RevokeOtherGuests(ctx context.Context, keepID primitive.ObjectID) error {
	now := time.Now().UTC()
	_, err := m.sessions.UpdateMany(ctx, bson.M{
		"is_guest":   true,
		"revoked_at": nil,
		"_id":        bson.M{"$ne": keepID},
	}, bson.M{
		"$set": bson.M{"revoked_at": now},
	})
	return err
}

func newToken() (raw string, hash string, err error) {
	buf := make([]byte, 32)
	if _, err = rand.Read(buf); err != nil {
		return "", "", err
	}
	raw = hex.EncodeToString(buf)
	return raw, hashToken(raw), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
