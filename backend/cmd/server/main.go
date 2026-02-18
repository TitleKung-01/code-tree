package main

import (
    "fmt"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "syscall"

    "github.com/rs/cors"
    "golang.org/x/net/http2"
    "golang.org/x/net/http2/h2c"

    "github.com/TitleKung-01/code-tree-backend/gen/node/v1/nodev1connect"
    "github.com/TitleKung-01/code-tree-backend/gen/tree/v1/treev1connect"
    "github.com/TitleKung-01/code-tree-backend/internal/config"
    "github.com/TitleKung-01/code-tree-backend/internal/middleware"
    "github.com/TitleKung-01/code-tree-backend/internal/repository/postgres"
    nodeService "github.com/TitleKung-01/code-tree-backend/internal/service/node"
    treeService "github.com/TitleKung-01/code-tree-backend/internal/service/tree"
)

func main() {
    // ==================== Config ====================
    cfg := config.Load()

    // ==================== Logger ====================
    logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelDebug,
    }))
    slog.SetDefault(logger)

    // ==================== Database ====================
    db, err := postgres.NewDB(cfg.DatabaseURL)
    if err != nil {
        slog.Error("failed to connect database", "error", err)
        os.Exit(1)
    }
    defer db.Close()

    // ==================== Repositories ====================
    treeRepo := postgres.NewTreeRepo(db)
    nodeRepo := postgres.NewNodeRepo(db)
    shareRepo := postgres.NewShareRepo(db)

    // ==================== Services ====================
    treeSvc := treeService.NewService(treeRepo, shareRepo)
    nodeSvc := nodeService.NewService(nodeRepo, treeRepo, shareRepo)

    // ==================== Auth Middleware ====================
    authMiddleware, err := middleware.NewAuthMiddleware(cfg.SupabaseURL, cfg.SupabaseJWTSecret)
    if err != nil {
        slog.Error("failed to create auth middleware", "error", err)
        os.Exit(1)
    }

    // ==================== Mux ====================
    mux := http.NewServeMux()

    // Health check (public)
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintf(w, `{"status":"ok","service":"code-tree-backend"}`)
    })

    // gRPC Services
    treePath, treeHandler := treev1connect.NewTreeServiceHandler(treeSvc)
    mux.Handle(treePath, authMiddleware.WrapOptional(treeHandler))
    slog.Info("registered service", "path", treePath)

    nodePath, nodeHandler := nodev1connect.NewNodeServiceHandler(nodeSvc)
    mux.Handle(nodePath, authMiddleware.WrapOptional(nodeHandler))
    slog.Info("registered service", "path", nodePath)

    // ==================== CORS ====================
    slog.Info("CORS allowed origins", "origins", cfg.AllowedOrigins)
    corsHandler := cors.New(cors.Options{
        AllowedOrigins:   cfg.AllowedOrigins,
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"*"},
        AllowCredentials: true,
    }).Handler(mux)

    // ==================== Server ====================
    addr := fmt.Sprintf(":%s", cfg.Port)
    slog.Info("server starting", "addr", addr)

    server := &http.Server{
        Addr:    addr,
        Handler: h2c.NewHandler(corsHandler, &http2.Server{}),
    }

    // Graceful shutdown
    go func() {
        sigChan := make(chan os.Signal, 1)
        signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
        <-sigChan
        slog.Info("shutting down server...")
        server.Close()
    }()

    if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        slog.Error("server failed", "error", err)
        os.Exit(1)
    }

    slog.Info("server stopped")
}