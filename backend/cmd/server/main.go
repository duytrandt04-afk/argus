package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"hooker/internal/config"
	"hooker/internal/repository/sqlite"
	"hooker/internal/server"
	"hooker/internal/service"
	"hooker/internal/version"
)

func main() {
	cfg := config.Load()

	// Pre-check: verify the DB path is writable before attempting open/migrate.
	// This produces an actionable fatal message instead of an opaque sqlite error.
	if cfg.DBPath != ":memory:" {
		f, err := os.OpenFile(cfg.DBPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
		if err != nil {
			log.Fatalf("db not writable at %s: check path exists and permissions — %v", cfg.DBPath, err)
		}
		_ = f.Close()
	}

	// Validate ADDR format — net.Listen returns an opaque error for bad formats.
	if _, _, err := net.SplitHostPort(cfg.Addr); err != nil {
		log.Fatalf("invalid ADDR %q: must be host:port — %v", cfg.Addr, err)
	}

	repo, err := sqlite.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("open db (check DB_PATH, permissions, or migration state): %v", err)
	}

	svc := service.New(repo)

	h := server.NewRouter(svc, repo.Ready)

	log.Printf("hooker version -> %s (%s)", version.Version, version.Commit)
	log.Printf("hook endpoint  -> POST http://%s/api/hook", cfg.Addr)
	log.Printf("events SSE     -> GET  http://%s/api/events/stream", cfg.Addr)
	log.Printf("db             -> %s", cfg.DBPath)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	srv := &http.Server{Addr: cfg.Addr, Handler: h}
	go func() {
		<-ctx.Done()
		_ = srv.Shutdown(context.Background())
	}()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		if isAddrInUse(err) {
			log.Fatalf("port %s already in use: stop the existing hooker process or change ADDR — %v", cfg.Addr, err)
		}
		log.Fatalf("listen: %v", err)
	}
}

// isAddrInUse reports whether err indicates the port is already bound.
func isAddrInUse(err error) bool {
	var opErr *net.OpError
	if errors.As(err, &opErr) {
		var syscallErr *os.SyscallError
		if errors.As(opErr.Err, &syscallErr) {
			return syscallErr.Err == syscall.EADDRINUSE
		}
	}
	return false
}
