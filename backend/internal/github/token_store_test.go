package github

import (
	"os"
	"path/filepath"
	"testing"
)

func TestTokenStoreRoundTripAndMode(t *testing.T) {
	dir := t.TempDir()
	s := NewTokenStore(dir)

	if _, _, ok := s.Load(); ok {
		t.Fatal("Load on empty store returned ok=true")
	}

	if err := s.Save("tok123", "ruy"); err != nil {
		t.Fatalf("Save: %v", err)
	}
	tok, login, ok := s.Load()
	if !ok || tok != "tok123" || login != "ruy" {
		t.Fatalf("Load = %q %q %v, want tok123 ruy true", tok, login, ok)
	}

	info, err := os.Stat(filepath.Join(dir, "github-token.json"))
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Errorf("perm = %v, want 0600", info.Mode().Perm())
	}

	if err := s.Delete(); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if _, _, ok := s.Load(); ok {
		t.Fatal("Load after Delete returned ok=true")
	}
	if err := s.Delete(); err != nil {
		t.Fatalf("Delete (idempotent): %v", err)
	}
}
