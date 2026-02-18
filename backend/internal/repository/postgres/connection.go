package postgres

import (
    "context"
    "fmt"
    "log/slog"
    "time"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
    Pool *pgxpool.Pool
}

func NewDB(databaseURL string) (*DB, error) {
    if databaseURL == "" {
        return nil, fmt.Errorf("DATABASE_URL is empty")
    }

    config, err := pgxpool.ParseConfig(databaseURL)
    if err != nil {
        return nil, fmt.Errorf("failed to parse database URL: %w", err)
    }

    config.MaxConns = 10
    config.MinConns = 2
    config.MaxConnLifetime = 30 * time.Minute
    config.MaxConnIdleTime = 5 * time.Minute

    // Required for Supabase Transaction Pooler (Supavisor) which doesn't support prepared statements
    config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

    // Connect
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    pool, err := pgxpool.NewWithConfig(ctx, config)
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    // Ping
    if err := pool.Ping(ctx); err != nil {
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }

    slog.Info("database connected successfully")

    return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
    db.Pool.Close()
    slog.Info("database connection closed")
}