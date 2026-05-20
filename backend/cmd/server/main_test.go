package main

import (
	"path/filepath"
	"testing"
)

func TestClaimEmbeddedWorkerPIDIsExclusive(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "hooker.db")
	release, claimed := claimEmbeddedWorkerPID(dbPath)
	if !claimed {
		t.Fatal("first claim should succeed")
	}
	defer release()

	if _, claimed := claimEmbeddedWorkerPID(dbPath); claimed {
		t.Fatal("second claim should fail while first PID is alive")
	}
}
