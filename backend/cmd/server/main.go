package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"hooker/internal/auth"
	"hooker/internal/config"
	"hooker/internal/queue"
	"hooker/internal/repository/sqlite"
	"hooker/internal/server"
	"hooker/internal/service"
	"hooker/internal/version"
	"hooker/internal/worker"
)

func main() {
	cfg := config.Load()

	repo, err := sqlite.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	// Job queue shares the same SQLite connection.
	jobQueue := queue.New(repo.RawDB())

	// Build AI worker. Defaults to AutoOAuth (reads Claude Desktop keychain).
	// Set ANTHROPIC_API_KEY env var to use API key auth instead.
	aiCfg := resolveAIConfig()
	w, err := worker.New(repo.RawDB(), repo, aiCfg)
	if err != nil {
		log.Printf("AI worker disabled: %v", err)
		w = nil
	}

	svc := service.New(repo)
	svc.WithQueue(jobQueue)

	h := server.NewRouter(svc, repo)

	log.Printf("hooker version -> %s", version.Version)
	log.Printf("hook endpoint  -> POST http://%s/api/hook", cfg.Addr)
	log.Printf("events SSE     -> GET  http://%s/api/events/stream", cfg.Addr)
	log.Printf("db             -> %s", cfg.DBPath)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if w != nil {
		releaseWorkerPID, claimed := claimEmbeddedWorkerPID(cfg.DBPath)
		if claimed {
			defer releaseWorkerPID()
			go w.Run(ctx)
			log.Println("AI worker started (embedded)")
		} else {
			log.Println("AI worker: standalone daemon detected, skipping embedded worker")
		}
	}

	srv := &http.Server{Addr: cfg.Addr, Handler: h}
	go func() {
		<-ctx.Done()
		_ = srv.Shutdown(context.Background())
	}()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}

func claimEmbeddedWorkerPID(dbPath string) (func(), bool) {
	pidFile := filepath.Join(filepath.Dir(dbPath), "hooker-worker.pid")
	if workerPIDRunning(pidFile) {
		return nil, false
	}

	f, err := os.OpenFile(pidFile, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return nil, false
	}
	defer f.Close()
	if _, err := fmt.Fprintf(f, "%d\n", os.Getpid()); err != nil {
		_ = os.Remove(pidFile)
		return nil, false
	}
	return func() { _ = os.Remove(pidFile) }, true
}

// workerPIDRunning returns true if a worker process is alive for this DB.
func workerPIDRunning(pidFile string) bool {
	data, err := os.ReadFile(pidFile)
	if err != nil {
		return false
	}
	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		_ = os.Remove(pidFile)
		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	if err := proc.Signal(syscall.Signal(0)); err != nil {
		_ = os.Remove(pidFile)
		return false
	}
	return true
}

// resolveAIConfig picks auth mode based on available credentials.
// Priority: ANTHROPIC_API_KEY env → AutoOAuth (Claude Desktop keychain).
func resolveAIConfig() auth.ClientConfig {
	if key := os.Getenv("ANTHROPIC_API_KEY"); key != "" {
		log.Println("AI auth: ANTHROPIC_API_KEY")
		return auth.ClientConfig{Mode: auth.AuthModeAPIKey, APIKey: key}
	}
	log.Println("AI auth: OAuth (Claude Desktop keychain)")
	return auth.ClientConfig{Mode: auth.AuthModeAutoOAuth}
}
