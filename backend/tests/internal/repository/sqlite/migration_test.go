package sqlite_test

import (
	"path/filepath"
	"testing"

	"hooker/internal/domain"
	"hooker/internal/repository/sqlite"
)

// newTestFileDB creates a file-based SQLite DB for migration testing.
// Uses t.TempDir() for automatic cleanup.
func newTestFileDB(t *testing.T) (*sqlite.DB, string) {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "test.db")
	db, err := sqlite.New(path)
	if err != nil {
		t.Fatalf("newTestFileDB: %v", err)
	}
	return db, path
}

// TestMigrationNewColumns opens a file-based DB (fresh — no pre-existing rows),
// asserts that the three normalization columns exist, inserts a row, reads it back,
// and verifies migration idempotency by calling New() again on the same path.
func TestMigrationNewColumns(t *testing.T) {
	db, path := newTestFileDB(t)

	// Assert normalizer_version, agent_version, normalization_status exist.
	rawDB := db.RawDB()
	rows, err := rawDB.Query(`PRAGMA table_info(hook_events)`)
	if err != nil {
		t.Fatalf("PRAGMA table_info: %v", err)
	}
	defer rows.Close()

	cols := map[string]bool{}
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull int
		var dfltValue any
		var pk int
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			t.Fatalf("scan table_info: %v", err)
		}
		cols[name] = true
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("table_info rows: %v", err)
	}

	for _, want := range []string{"normalizer_version", "agent_version", "normalization_status"} {
		if !cols[want] {
			t.Errorf("column %q missing from hook_events after migration", want)
		}
	}

	// Insert a row and verify normalization_status round-trips correctly.
	e := domain.NormalizedEvent{
		Time:                "2025-01-01T00:00:00Z",
		Agent:               "claudecode",
		Session:             "sess-migration-01",
		HookEventName:       "PreToolUse",
		TurnID:              "t1",
		ToolUseID:           "u1",
		RawPayload:          []byte(`{}`),
		NormalizationStatus: "ok",
		NormalizerVersion:   "claudecode/1",
	}
	if err := db.Add(e); err != nil {
		t.Fatalf("Add after migration: %v", err)
	}

	events, err := db.List(10)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("got %d events, want 1", len(events))
	}
	if events[0].NormalizationStatus != "ok" {
		t.Errorf("NormalizationStatus = %q, want %q", events[0].NormalizationStatus, "ok")
	}
	if events[0].NormalizerVersion != "claudecode/1" {
		t.Errorf("NormalizerVersion = %q, want %q", events[0].NormalizerVersion, "claudecode/1")
	}

	// Verify migration idempotency: calling New() again on same path must not error.
	db2, err := sqlite.New(path)
	if err != nil {
		t.Fatalf("second sqlite.New on same path: %v", err)
	}
	defer db2.RawDB().Close()
}
