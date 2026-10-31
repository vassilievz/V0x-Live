package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/v0xlive/v0x-live/apps/api/internal/models"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository struct {
	users *mongo.Collection
}

func NewUserRepository(users *mongo.Collection) *UserRepository {
	return &UserRepository{users: users}
}

type GoogleProfile struct {
	ID        string
	Email     string
	Name      string
	AvatarURL string
}

func (r *UserRepository) UpsertGoogleUser(ctx context.Context, profile GoogleProfile) (models.User, error) {
	now := time.Now().UTC()
	filter := bson.M{"google_id": profile.ID}
	update := bson.M{
		"$set": bson.M{
			"email":        strings.TrimSpace(profile.Email),
			"display_name": strings.TrimSpace(profile.Name),
			"avatar_url":   strings.TrimSpace(profile.AvatarURL),
			"updated_at":   now,
		},
		"$setOnInsert": bson.M{
			"created_at": now,
		},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var user models.User
	err := r.users.FindOneAndUpdate(ctx, filter, update, opts).Decode(&user)
	return user, err
}

func (r *UserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (models.User, error) {
	var user models.User
	err := r.users.FindOne(ctx, bson.M{"_id": id, "deleted_at": nil}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.User{}, ErrUserNotFound
		}
		return models.User{}, err
	}
	return user, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id primitive.ObjectID, displayName, avatarURL string) error {
	res, err := r.users.UpdateOne(ctx, bson.M{"_id": id, "deleted_at": nil}, bson.M{
		"$set": bson.M{
			"display_name": displayName,
			"avatar_url":   avatarURL,
			"updated_at":   time.Now().UTC(),
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrUserNotFound
	}
	return nil
}
