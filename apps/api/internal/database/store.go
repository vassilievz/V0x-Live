package database

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type Store struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func Connect(ctx context.Context, mongoURL string) (*Store, error) {
	opts := options.Client().
		ApplyURI(mongoURL).
		SetServerSelectionTimeout(15 * time.Second)

	client, err := mongo.Connect(ctx, opts)
	if err != nil {
		return nil, fmt.Errorf("connect mongo: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := client.Ping(pingCtx, readpref.Primary()); err != nil {
		_ = client.Disconnect(ctx)
		return nil, fmt.Errorf("ping mongo: %w", err)
	}

	dbName := dbNameFromURL(mongoURL)
	db := client.Database(dbName)

	store := &Store{Client: client, Database: db}
	if err := store.EnsureIndexes(ctx); err != nil {
		_ = client.Disconnect(ctx)
		return nil, err
	}

	return store, nil
}

func (s *Store) Collection(name string) *mongo.Collection {
	return s.Database.Collection(name)
}

func (s *Store) Close(ctx context.Context) error {
	if s.Client == nil {
		return nil
	}
	return s.Client.Disconnect(ctx)
}

func (s *Store) EnsureIndexes(ctx context.Context) error {
	indexCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	specs := []struct {
		collection string
		models     []mongo.IndexModel
	}{
		{
			collection: "users",
			models: []mongo.IndexModel{
				{Keys: bson.D{{Key: "email", Value: 1}}, Options: options.Index().SetUnique(true)},
			},
		},
		{
			collection: "user_sessions",
			models: []mongo.IndexModel{
				{Keys: bson.D{{Key: "token_hash", Value: 1}}, Options: options.Index().SetUnique(true)},
				{Keys: bson.D{{Key: "expires_at", Value: 1}}, Options: options.Index().SetExpireAfterSeconds(0)},
			},
		},
		{
			collection: "rooms",
			models: []mongo.IndexModel{
				{Keys: bson.D{{Key: "slug", Value: 1}}, Options: options.Index().SetUnique(true)},
				{Keys: bson.D{{Key: "invite_code", Value: 1}}, Options: options.Index().SetUnique(true)},
				{Keys: bson.D{{Key: "visibility", Value: 1}, {Key: "status", Value: 1}, {Key: "updated_at", Value: -1}}},
			},
		},
		{
			collection: "room_participants",
			models: []mongo.IndexModel{
				{
					Keys:    bson.D{{Key: "room_id", Value: 1}, {Key: "session_id", Value: 1}},
					Options: options.Index().SetUnique(true),
				},
				{Keys: bson.D{{Key: "room_id", Value: 1}, {Key: "left_at", Value: 1}}},
			},
		},
		{
			collection: "password_resets",
			models: []mongo.IndexModel{
				{Keys: bson.D{{Key: "token_hash", Value: 1}}, Options: options.Index().SetUnique(true)},
				{Keys: bson.D{{Key: "expires_at", Value: 1}}, Options: options.Index().SetExpireAfterSeconds(0)},
			},
		},
		{
			collection: "chat_messages",
			models: []mongo.IndexModel{
				{Keys: bson.D{{Key: "room_id", Value: 1}, {Key: "created_at", Value: -1}}},
			},
		},
	}

	for _, spec := range specs {
		_, err := s.Collection(spec.collection).Indexes().CreateMany(indexCtx, spec.models)
		if err != nil {
			return fmt.Errorf("indexes %s: %w", spec.collection, err)
		}
	}

	return nil
}

func dbNameFromURL(raw string) string {
	path := raw
	if i := strings.Index(raw, "://"); i >= 0 {
		path = raw[i+3:]
	}
	if at := strings.Index(path, "@"); at >= 0 {
		path = path[at+1:]
	}
	slash := strings.Index(path, "/")
	if slash < 0 {
		return "v0xlive"
	}
	name := path[slash+1:]
	if q := strings.Index(name, "?"); q >= 0 {
		name = name[:q]
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return "v0xlive"
	}
	return name
}
