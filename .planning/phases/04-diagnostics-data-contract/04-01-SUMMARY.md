---
phase: 04-diagnostics-data-contract
plan: 01
subsystem: backend-data-contract
tags: [go, sqlite, diagnostics, repository]

requires:
  - phase: v1.0
    provides: existing event/session SQLite storage and repository interface
provides:
  - Diagnostics domain response and storage aggregate structs
  - EventRepository diagnostics aggregate contract
  - SQLite diagnostics aggregate implementation using COUNT and MAX queries
affects: [phase-04, phase-05, phase-06, diagnostics]

tech-stack:
  added: []
  patterns: [typed diagnostics domain structs, repository aggregate method, targeted sqlite aggregate queries]

key-files:
  created:
    - backend/internal/domain/diagnostics.go
  modified:
    - backend/internal/repository/repository.go
    - backend/internal/repository/sqlite/sqlite.go
    - backend/tests/internal/service/event_service_test.go
    - backend/tests/internal/server/router_test.go

key-decisions:
  - "Diagnostics storage stats use a dedicated repository method instead of dashboard/list flows."
  - "Diagnostics nullable values use pointer fields so JSON can encode null for unavailable size and empty latest event."

patterns-established:
  - "Diagnostics storage aggregates are read through EventRepository.DiagnosticsStorageStats()."
  - "SQLite diagnostics totals use targeted COUNT(*) and MAX(created_at) queries."

requirements-completed: [DIAG-03, DIAG-04, TEST-01]

duration: 5 min
completed: 2026-05-27
---

# Phase 4 Plan 01: Diagnostics Data Contract Summary

**Diagnostics domain structs and SQLite aggregate repository contract for storage facts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-27T16:45:00Z
- **Completed:** 2026-05-27T16:50:37Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added typed diagnostics response structs with grouped `version`, `health`, and `storage` sections.
- Added `EventRepository.DiagnosticsStorageStats()` for diagnostics-specific aggregate reads.
- Implemented SQLite aggregate queries for total events, total sessions, and latest event timestamp.
- Updated existing service and router test doubles so the repository interface compiles.

## Task Commits

1. **Tasks 1-3: Domain structs, repository contract, SQLite aggregate implementation** - `25a2f18` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `backend/internal/domain/diagnostics.go` - Diagnostics response and storage stats structs with camelCase JSON tags and nullable pointer fields.
- `backend/internal/repository/repository.go` - Repository interface now includes `DiagnosticsStorageStats`.
- `backend/internal/repository/sqlite/sqlite.go` - SQLite aggregate implementation using `COUNT(*)` and `MAX(created_at)`.
- `backend/tests/internal/service/event_service_test.go` - Mock repository stub updated for new interface method.
- `backend/tests/internal/server/router_test.go` - No-op repository stub updated for new interface method.

## Decisions Made

- Used a dedicated repository aggregate method per CONTEXT D-18.
- Kept diagnostics domain structs separate from existing event/session domain structs to avoid mixing captured-content models with diagnostics response models.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope changes.

## Issues Encountered

- Initial `go test` attempted to use the default Go build cache under `~/Library/Caches`, which is outside the sandbox. Re-ran the same tests with `GOCACHE=/private/tmp/hooker-gocache`; tests passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can now compose diagnostics from the new domain structs and `EventRepository.DiagnosticsStorageStats()`.

---
*Phase: 04-diagnostics-data-contract*
*Completed: 2026-05-27*
