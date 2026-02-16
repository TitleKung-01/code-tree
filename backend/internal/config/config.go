package config

import "os"

type Config struct {
    Port        string
    DatabaseURL string
    SupabaseJWTSecret string
}

func Load() *Config {
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