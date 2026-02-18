package config

import (
    "log/slog"
    "os"
    "strings"

    "github.com/joho/godotenv"
)

type Config struct {
    Port              string
    DatabaseURL       string
    SupabaseURL       string
    SupabaseJWTSecret string
    AllowedOrigins    []string
}

func Load() *Config {
    err := godotenv.Load()
    if err != nil {
        slog.Info("no .env file found, using environment variables")
    }

    origins := []string{"http://localhost:3000", "http://localhost:3001"}
    if extra := os.Getenv("ALLOWED_ORIGINS"); extra != "" {
        for _, o := range strings.Split(extra, ",") {
            o = strings.TrimSpace(o)
            if o != "" {
                origins = append(origins, o)
            }
        }
    }

    return &Config{
        Port:              getEnv("PORT", "8080"),
        DatabaseURL:       getEnv("DATABASE_URL", ""),
        SupabaseURL:       getEnv("SUPABASE_URL", ""),
        SupabaseJWTSecret: getEnv("SUPABASE_JWT_SECRET", ""),
        AllowedOrigins:    origins,
    }
}

func getEnv(key, fallback string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return fallback
}