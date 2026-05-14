package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Addr   string
	DBPath string
}

func Load() Config {
	return Config{
		Addr:   envOr("ADDR", "127.0.0.1:8765"),
		DBPath: envOr("DB_PATH", defaultDBPath()),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func defaultDBPath() string {
	cwd, err := os.Getwd()
	if err != nil {
		return defaultFromExecutable()
	}

	// Case 1: started somewhere under backend/ (e.g. backend or backend/cmd/server).
	if backendRoot, ok := findBackendRoot(cwd); ok {
		return filepath.Join(backendRoot, "hooker.db")
	}

	// Case 2: started from repository root that contains a backend/ folder.
	backendDir := filepath.Join(cwd, "backend")
	if isBackendRoot(backendDir) {
		return filepath.Join(backendDir, "hooker.db")
	}

	// Case 3: launched from an unrelated cwd; infer from executable location.
	return defaultFromExecutable()
}

func findBackendRoot(start string) (string, bool) {
	dir := start
	for {
		if isBackendRoot(dir) {
			return dir, true
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", false
		}
		dir = parent
	}
}

func isBackendRoot(dir string) bool {
	if _, err := os.Stat(filepath.Join(dir, "go.mod")); err != nil {
		return false
	}
	if _, err := os.Stat(filepath.Join(dir, "cmd", "server", "main.go")); err != nil {
		return false
	}
	return true
}

func defaultFromExecutable() string {
	exePath, err := os.Executable()
	if err == nil {
		if backendRoot, ok := findBackendRoot(filepath.Dir(exePath)); ok {
			return filepath.Join(backendRoot, "hooker.db")
		}
	}
	return "hooker.db"
}
