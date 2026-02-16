package config

import (
    "log/slog"
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    Port              string
    DatabaseURL       string
    SupabaseJWTSecret string
}

func Load() *Config {
    // Load .env file (ignore error if not found)
    err := godotenv.Load()
    if err != nil {
        slog.Info("no .env file found, using environment variables")
    }

    return &Config{
        Port:              getEnv("PORT", "8080"),
        DatabaseURL:       getEnv("DATABASE_URL", ""),
        SupabaseJWTSecret: getEnv("SUPABASE_JWT_SECRET", ""),
    }
}

func getEnv(key, fallback string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return fallback
}