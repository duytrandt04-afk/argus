package config_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"hooker/internal/config"
)

func TestLoad_defaults(t *testing.T) {
	if err := os.Unsetenv("ADDR"); err != nil {
		t.Fatalf("Unsetenv ADDR: %v", err)
	}
	if err := os.Unsetenv("DB_PATH"); err != nil {
		t.Fatalf("Unsetenv DB_PATH: %v", err)
	}
	cfg := config.Load()
	if cfg.Addr != "127.0.0.1:8765" {
		t.Errorf("Addr = %q, want 127.0.0.1:8765", cfg.Addr)
	}
	if !strings.HasSuffix(filepath.ToSlash(cfg.DBPath), "backend/hooker.db") {
		t.Errorf("DBPath = %q, want suffix backend/hooker.db", cfg.DBPath)
	}
}

func TestLoad_env(t *testing.T) {
	t.Setenv("ADDR", "0.0.0.0:9000")
	t.Setenv("DB_PATH", "/tmp/test.db")
	cfg := config.Load()
	if cfg.Addr != "0.0.0.0:9000" {
		t.Errorf("Addr = %q, want 0.0.0.0:9000", cfg.Addr)
	}
	if cfg.DBPath != "/tmp/test.db" {
		t.Errorf("DBPath = %q, want /tmp/test.db", cfg.DBPath)
	}
}
