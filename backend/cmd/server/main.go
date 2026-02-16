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
)

func main() {
    // Load config
    cfg := config.Load()

    // Logger
    logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))
    slog.SetDefault(logger)

    // Mux
    mux := http.NewServeMux()

    // Health check
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, `{"status":"ok","service":"code-tree-backend"}`)
    })

    // TODO: Day 3 — Register gRPC services here
    // path, handler := treev1connect.NewTreeServiceHandler(&treeService{})
    // mux.Handle(path, handler)

    // CORS
    corsHandler := cors.New(cors.Options{
        AllowedOrigins:   []string{"http://localhost:3000"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"*"},
        AllowCredentials: true,
    }).Handler(mux)

    // Server with HTTP/2 (required for Connect/gRPC)
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