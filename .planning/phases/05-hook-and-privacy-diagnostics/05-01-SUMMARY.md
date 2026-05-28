---
phase: 05-hook-and-privacy-diagnostics
plan: 01
subsystem: api
tags: [go, sqlite, diagnostics, agents]

requires:
  - phase: 04-diagnostics-data-contract
    provides: "Read-only diagnostics endpoint with version, health, and storage sections"
provides:
  - "Claude Code and Codex diagnostics agent rows"
  - "Targeted SQLite aggregate method for agent diagnostics"
  - "Service-level no-events and degraded warning composition"
affects: [diagnostics, phase-05, phase-06]

tech-stack:
  added: []
  patterns: ["Diagnostics aggregates use targeted repository SQL and service composition"]

key-files:
  created: []
  modified:
    - backend/internal/domain/diagnostics.go
    - backend/internal/repository/repository.go
    - backend/internal/repository/sqlite/sqlite.go
    - backend/internal/service/event_service.go
    - backend/tests/internal/repository/sqlite/sqlite_test.go
    - backend/tests/internal/service/event_service_test.go
    - backend/tests/internal/handler/diagnostics_test.go
    - backend/tests/internal/server/router_test.go

key-decisions:
  - "Diagnostics emits Claude Code and Codex rows only; Gemini CLI remains deferred."
  - "Agent eventCount and lastSeenAt are session-based."
  - "Degraded status is a warning and does not affect health/readiness."

patterns-established:
  - "DiagnosticsAgentStats is the repository boundary for agent telemetry aggregates."
  - "EventService.Diagnostics always backfills supported-agent rows even when aggregates are empty."

requirements-completed: [HOOK-01, HOOK-02, HOOK-03, HOOK-05]

duration: 8 min
completed: 2026-05-28
---

# Phase 5 Plan 01: Agent Telemetry Diagnostics Summary

**Claude Code and Codex diagnostics rows backed by targeted SQLite aggregates and non-fatal warning status**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T03:44:00Z
- **Completed:** 2026-05-28T03:52:06Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `agents` to the diagnostics response with exactly two supported rows: Claude Code and Codex.
- Added `DiagnosticsAgentStats()` to the repository interface and SQLite adapter.
- Composed `no events` and `degraded` per-agent warning statuses without changing diagnostics health/readiness.
- Updated repository, service, handler, and router tests for the new response section and interface method.

## Task Commits

Each task was committed atomically:

1. **Task 1-3: Agent telemetry diagnostics** - `b2c00ec` (feat)

**Plan metadata:** pending (this summary commit)

## Files Created/Modified

- `backend/internal/domain/diagnostics.go` - Adds agent diagnostics response and aggregate structs.
- `backend/internal/repository/repository.go` - Extends the repository boundary with `DiagnosticsAgentStats`.
- `backend/internal/repository/sqlite/sqlite.go` - Adds targeted aggregate queries for session counts, last-seen timestamps, degraded counts, and latest normalizer versions.
- `backend/internal/service/event_service.go` - Composes Claude Code and Codex diagnostics rows.
- `backend/tests/internal/repository/sqlite/sqlite_test.go` - Covers empty and populated agent aggregate behavior.
- `backend/tests/internal/service/event_service_test.go` - Covers two-agent row composition and warning status behavior.
- `backend/tests/internal/handler/diagnostics_test.go` - Updates response shape and sensitive-content leak checks.
- `backend/tests/internal/server/router_test.go` - Updates repository test double for the new interface method.

## Decisions Made

- Followed `05-CONTEXT.md`: Gemini CLI is deferred and not emitted as a diagnostics row.
- Kept hook config status as `unknown` for Plan 01; Plan 02 owns actual config detection.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope changes.

## Issues Encountered

The first red test command targeted internal packages without colocated tests; rerunning against `backend/tests/internal/...` produced the expected compile failures for missing diagnostics symbols.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can now merge hook config status into the existing Claude Code and Codex agent rows.

## Self-Check: PASSED

- `go test ./tests/internal/repository/sqlite -run 'Diagnostics.*Agent|DiagnosticsStorage'` passed.
- `go test ./tests/internal/service ./tests/internal/handler ./tests/internal/server` passed.
- Summary exists and references production commit `b2c00ec`.

---
*Phase: 05-hook-and-privacy-diagnostics*
*Completed: 2026-05-28*
