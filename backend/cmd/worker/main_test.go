package main

import (
	"path/filepath"
	"testing"
)

func TestWritePIDFailsWhenFileAlreadyExists(t *testing.T) {
	pidFile := filepath.Join(t.TempDir(), "hooker-worker.pid")
	if err := writePID(pidFile); err != nil {
		t.Fatalf("first writePID: %v", err)
	}
	if err := writePID(pidFile); err == nil {
		t.Fatal("second writePID should fail when pid file already exists")
	}
}
