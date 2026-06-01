---
phase: 11-frontend-polish-ux
plan: "01"
subsystem: diagnostics-cache
tags: [performance, caching, backend, frontend, tdd]
dependency_graph:
  requires: []
  provides: [diagnostics-30s-ttl-cache, diagnostics-nav-cache]
  affects: [backend/internal/service/event_service.go, frontend/src/features/diagnostics/hooks/useDiagnostics.ts]
tech_stack:
  added: []
  patterns: [sync.RWMutex TTL cache, module-level React navigation cache]
key_files:
  created: []
  modified:
    - backend/internal/service/event_service.go
    - backend/tests/internal/service/event_service_test.go
    - frontend/src/features/diagnostics/hooks/useDiagnostics.ts
    - frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx
decisions:
  - "Cache stored only on successful repo calls — error paths bypass cache store"
  - "Frontend cache has no TTL — backend 30s TTL governs freshness; module cache only prevents navigation re-fetches"
  - "SetDiagCachedAt exported as test helper; _resetDiagnosticsCache exported for frontend test isolation"
metrics:
  duration: "~10min"
  completed: "2026-06-01T15:59:01Z"
  tasks_completed: 2
  files_modified: 4
---

# Phase 11 Plan 01: Diagnostics Cache Summary

**One-liner:** 30s TTL backend cache via sync.RWMutex + module-level frontend navigation cache eliminate redundant full-table-scan calls on /api/diagnostics.

## What Was Built

### Task 1: Backend 30s TTL cache in EventService.DiagnosticsWithOptions

Added three fields to `EventService`:
- `diagMu sync.RWMutex` — protects cache reads and writes
- `diagCache *domain.Diagnostics` — cached result pointer
- `diagCachedAt time.Time` — timestamp for TTL check

Logic: `DiagnosticsWithOptions` acquires a read lock first; if cache is non-nil and age < 30s, returns a shallow copy (`*s.diagCache`) without calling the repo. On cache miss, calls both repo methods, assembles the full result, then stores to cache under a write lock. Error paths do not write to cache.

Added `SetDiagCachedAt(t time.Time)` test-helper method for TTL injection.

Tests added: `TestDiagnosticsCache` (verifies `diagnosticsCalls` stays at 1 on second call within TTL), `TestDiagnosticsCacheTTL` (injects 31s-past timestamp, verifies counter increments on re-fetch).

### Task 2: Frontend module-level navigation cache in useDiagnostics

Added two module-level variables:
- `diagnosticsCache: Diagnostics | null` — cached response
- `diagnosticsCachedAt: Date | null` — timestamp for display

Logic: `useEffect` checks `reloadKey === 0 && diagnosticsCache !== null` before fetching. Navigation remounts (reloadKey stays 0) hydrate from the module cache synchronously. Explicit `reload()` calls increment reloadKey, bypassing the cache.

Initial state initializers use `() => diagnosticsCache` and `() => diagnosticsCachedAt` so a warm cache prevents a loading flash on remount.

Exported `_resetDiagnosticsCache()` for test isolation; all `beforeEach` blocks call it to prevent cross-test cache bleed.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 (backend) | 35947d1 | feat(11-01): add 30s TTL cache to EventService.DiagnosticsWithOptions |
| Task 2 (frontend) | e176a94 | feat(11-01): add module-level cache to useDiagnostics hook |

## Verification Results

- `go test ./tests/internal/service/... -run TestDiagnosticsCache` — PASS
- `go test ./tests/internal/service/... -run TestDiagnosticsCacheTTL` — PASS
- `go test ./...` — 178 tests PASS (no regressions)
- `go build ./...` — SUCCESS
- `go vet ./...` — no issues
- `npx tsc --noEmit` — no type errors
- `npx vitest run tests/features/diagnostics/` — 10 tests PASS (including new no-remount-fetch)
- `npx vitest run` — 88 tests PASS (no regressions)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incomplete mock data in no-remount-fetch test**
- **Found during:** Task 2 GREEN phase
- **Issue:** Test used `{ version: {}, health: { live: true, ready: true } }` as mock data; DiagnosticsPage's `LoadedContent` component calls `.agents.filter()` on the cached data during re-mount render, causing `TypeError: Cannot read properties of undefined (reading 'filter')`
- **Fix:** Replaced incomplete inline mock with the already-defined `healthyDiagnostics` fixture (full valid Diagnostics object)
- **Files modified:** `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx`
- **Commit:** Included in e176a94

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The `SetDiagCachedAt` method is exported but its name makes it clearly a test helper. The module-level `diagnosticsCache` is in-process memory only — matches T-11-03 acceptance in the plan's threat model.

## Self-Check: PASSED

- `backend/internal/service/event_service.go` — FOUND
- `backend/tests/internal/service/event_service_test.go` — FOUND
- `frontend/src/features/diagnostics/hooks/useDiagnostics.ts` — FOUND
- `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx` — FOUND
- Commit 35947d1 — FOUND
- Commit e176a94 — FOUND
