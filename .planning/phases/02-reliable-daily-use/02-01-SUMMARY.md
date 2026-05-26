---
phase: 02-reliable-daily-use
plan: "01"
subsystem: backend/persistence
tags: [migration, schema, domain, sqlite, tdd]
dependency_graph:
  requires: []
  provides:
    - migration-008-normalization-fields
    - domain-normalization-fields
    - transactional-migration-runner
  affects:
    - backend/internal/domain/event.go
    - backend/internal/repository/sqlite/sqlite.go
    - backend/internal/repository/sqlite/migrations/
tech_stack:
  added: []
  patterns:
    - normalizationStatus() helper — coerces empty string to 'ok' before INSERT into NOT NULL DEFAULT column
    - Transactional migration runner — tx.Begin/Exec/Commit wraps DDL + version record atomically
key_files:
  created:
    - backend/internal/repository/sqlite/migrations/008_normalization_fields.sql
  modified:
    - backend/internal/domain/event.go
    - backend/internal/repository/sqlite/sqlite.go
    - backend/tests/internal/repository/sqlite/sqlite_test.go
decisions:
  - "normalizationStatus() helper passes 'ok' instead of nil for empty status — INSERT OR IGNORE silently drops rows when nil is supplied to a NOT NULL column"
  - "Transactional migration runner replaces all 8 migrations (not just new ones) — consistent behavior across all versions"
metrics:
  duration: "3 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  files_changed: 4
---

# Phase 2 Plan 01: Migration 008 Normalization Fields Summary

Migration 008 adds three normalization metadata columns to hook_events (normalizer_version, agent_version, normalization_status TEXT NOT NULL DEFAULT 'ok'), makes the migration runner transactional (HARD-05), and wires the three fields through domain.NormalizedEvent and the Add()/listWithWhere() SQL layer.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| TDD RED | Failing tests for migration 008 fields | b8d8d9f | sqlite_test.go (+4 tests) |
| 1+2 GREEN | Migration 008 + transactional runner + domain fields | c86fee0 | 008_normalization_fields.sql, sqlite.go, event.go |

## What Was Built

**Migration 008** (`008_normalization_fields.sql`): Three `ALTER TABLE hook_events ADD COLUMN` statements adding `normalizer_version TEXT`, `agent_version TEXT`, and `normalization_status TEXT NOT NULL DEFAULT 'ok'`.

**Transactional migration runner**: The `migrate()` loop body in `sqlite.go` now wraps each migration in `tx.Begin()` / `tx.Exec()` / `tx.Commit()`. If the DDL fails, `tx.Rollback()` is called and the version record is never written — so the next startup re-attempts cleanly.

**Domain fields** (`domain/event.go`): Three new fields on `NormalizedEvent`:
- `NormalizationStatus string` with `json:"normalization_status,omitempty"` (NOT `json:"-"` — surfaces in API responses)
- `NormalizerVersion string` with `json:"normalizer_version,omitempty"`
- `AgentVersion string` with `json:"agent_version,omitempty"`

**SQL layer updates**: `Add()` INSERT now has 46 columns/46 placeholders including the three new fields. `listWithWhere()` SELECT and Scan include the three fields via `COALESCE(...,'')`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed NOT NULL constraint failure on INSERT OR IGNORE for normalization_status**
- **Found during:** GREEN phase — TestMigration008_DefaultStatus returned "no rows in result set"
- **Issue:** `nullStr("")` returns `nil`, and `INSERT OR IGNORE` silently drops rows when `nil` is supplied to a `NOT NULL DEFAULT 'ok'` column (SQLite DEFAULT only fires when the column is omitted from the column list, not when an explicit NULL is given)
- **Fix:** Added `normalizationStatus()` helper that returns `"ok"` for empty string instead of `nil`; used this helper specifically for the `normalization_status` value in `Add()`
- **Files modified:** `backend/internal/repository/sqlite/sqlite.go`
- **Commit:** c86fee0

## Known Stubs

None.

## Threat Flags

None. The three new columns are non-sensitive metadata fields on the existing local-only hook_events table. No new network endpoints or auth boundaries introduced.

## Self-Check: PASSED

- `backend/internal/repository/sqlite/migrations/008_normalization_fields.sql` — FOUND
- `backend/internal/domain/event.go` has NormalizationStatus — FOUND (3 fields)
- `backend/internal/repository/sqlite/sqlite.go` has tx.Commit — FOUND
- `go build ./...` — PASSED
- `go test ./...` — PASSED (82 tests)
- Commits b8d8d9f (RED) and c86fee0 (GREEN) — FOUND in git log
