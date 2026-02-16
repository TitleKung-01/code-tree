package main

import (
    "fmt"
    "log/slog"
    "net/http"
    "os"

    "github.com/rs/cors"
    "golang.org/x/net/http2"
    "golang.org/x/net/http2/h2c"

    "github.com/TitleKung-01/code-tree-backend/internal/config"
    "github.com/TitleKung-01/code-tree-backend/internal/middleware"
)

func main() {
    // Load config
    cfg := config.Load()

    // Logger
    logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))
    slog.SetDefault(logger)

    // Auth middleware
    authMiddleware := middleware.NewAuthMiddleware(cfg.SupabaseJWTSecret)

    // Mux
    mux := http.NewServeMux()

    // Health check (public — ไม่ต้อง auth)
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, `{"status":"ok","service":"code-tree-backend"}`)
    })

    // Test auth endpoint
    mux.Handle("/api/me", authMiddleware.Wrap(http.HandlerFunc(
        func(w http.ResponseWriter, r *http.Request) {
            userID, _ := middleware.GetUserID(r.Context())
            email := middleware.GetUserEmail(r.Context())
            w.Header().Set("Content-Type", "application/json")
            fmt.Fprintf(w, `{"user_id":"%s","email":"%s"}`, userID, email)
        },
    )))

    // TODO: Day 3 — Register gRPC services here
    // ใช้ authMiddleware.Wrap() ครอบ gRPC handlers

    // CORS
    corsHandler := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:3000"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"*"},
        AllowCredentials: true,
    }).Handler(mux)

    // Server
    addr := fmt.Sprintf(":%s", cfg.Port)
    slog.Info("server starting", "addr", addr)

    err := http.ListenAndServe(
        addr,
        h2c.NewHandler(corsHandler, &http2.Server{}),
    )
    if err != nil {
        slog.Error("server failed", "error", err)
        os.Exit(1)
    }
}