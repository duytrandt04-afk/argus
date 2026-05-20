// hooker-worker: standalone daemon that polls the SQLite job queue and calls
// the Anthropic API to generate summaries and observations.
// Spawned by the SessionStart Claude Code hook; manages its own PID file so
// only one instance runs per DB.
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"hooker/internal/auth"
	"hooker/internal/config"
	"hooker/internal/repository/sqlite"
	"hooker/internal/worker"
)

func main() {
	cfg := config.Load()

	pidFile := pidFilePath(cfg.DBPath)

	// If another instance is already running for this DB, exit silently.
	if running, pid := isRunning(pidFile); running {
		log.Printf("[worker-daemon] already running (pid %d), exiting", pid)
		os.Exit(0)
	}

	if err := writePID(pidFile); err != nil {
		log.Fatalf("[worker-daemon] write PID: %v", err)
	}
	defer removePID(pidFile)

	repo, err := sqlite.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("[worker-daemon] open db: %v", err)
	}

	aiCfg := resolveAIConfig()
	w, err := worker.New(repo.RawDB(), repo, aiCfg)
	if err != nil {
		log.Fatalf("[worker-daemon] build worker: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Printf("[worker-daemon] started (pid %d, db %s)", os.Getpid(), cfg.DBPath)
	w.Run(ctx)
	log.Println("[worker-daemon] exiting")
}

func pidFilePath(dbPath string) string {
	return filepath.Join(filepath.Dir(dbPath), "hooker-worker.pid")
}

func isRunning(pidFile string) (bool, int) {
	data, err := os.ReadFile(pidFile)
	if err != nil {
		return false, 0
	}
	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return false, 0
	}
	// Check if process is alive by sending signal 0.
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false, 0
	}
	if err := proc.Signal(syscall.Signal(0)); err != nil {
		// Process dead — stale PID file.
		_ = os.Remove(pidFile)
		return false, 0
	}
	return true, pid
}

func writePID(pidFile string) error {
	f, err := os.OpenFile(pidFile, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = fmt.Fprintf(f, "%d\n", os.Getpid())
	return err
}

func removePID(pidFile string) {
	_ = os.Remove(pidFile)
}

func resolveAIConfig() auth.ClientConfig {
	if key := os.Getenv("ANTHROPIC_API_KEY"); key != "" {
		log.Println("[worker-daemon] AI auth: ANTHROPIC_API_KEY")
		return auth.ClientConfig{Mode: auth.AuthModeAPIKey, APIKey: key}
	}
	log.Println("[worker-daemon] AI auth: OAuth (Claude Desktop keychain)")
	return auth.ClientConfig{Mode: auth.AuthModeAutoOAuth}
}
