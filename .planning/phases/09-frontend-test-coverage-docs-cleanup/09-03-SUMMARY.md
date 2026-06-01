---
phase: 09-frontend-test-coverage-docs-cleanup
plan: "03"
subsystem: frontend-tests, docs
tags: [testing, vitest, cleanup, docs]
dependency_graph:
  requires: []
  provides: [TEST-03, DOCS-01]
  affects: [frontend/tests/features/version/VersionBadge.test.tsx]
tech_stack:
  added: []
  patterns:
    - vi.stubGlobal('fetch') for component fetch mock per Phase 2 decision
    - waitFor for async null-state assertions after rejected/non-OK fetch
key_files:
  created:
    - frontend/tests/features/version/VersionBadge.test.tsx
  modified: []
  deleted:
    - docs/superpowers/specs/2026-05-13-sessions-waterfall-redesign.md
    - docs/superpowers/specs/2026-05-14-project-scoped-session-traces.md
    - docs/superpowers/specs/2026-05-15-semantic-session-summaries.md
    - docs/superpowers/specs/2026-05-16-trace-panel-responsive-design.md
    - docs/superpowers/plans/2026-05-13-sessions-waterfall.md
    - docs/superpowers/plans/2026-05-13-sessions-waterfall-redesign.md
    - docs/superpowers/plans/2026-05-15-semantic-session-summaries-plan.md
    - docs/superpowers/plans/2026-05-16-trace-panel-responsive.md
decisions:
  - VersionBadge tests use vi.stubGlobal('fetch') consistent with Phase 2 decision; vi.spyOn(Storage.prototype) prohibited
  - Null-state tests for rejected and non-OK fetch use waitFor to wait for async resolution before asserting empty DOM
  - Stale superpowers docs were untracked by git; deleted from filesystem only, no git rm required
metrics:
  duration: 2min
  completed_date: "2026-06-01"
  tasks_completed: 2
  files_created: 1
  files_deleted: 8
---

# Phase 09 Plan 03: VersionBadge Test Coverage and Stale Docs Removal Summary

VersionBadge Vitest suite covering loaded (commit shortening + commit-none), pending (loading null), rejected-fetch (error null), and non-OK-fetch (error null) states; eight stale trace/waterfall/semantic superpowers docs deleted from active docs directories.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add VersionBadge state coverage | e6da836 | frontend/tests/features/version/VersionBadge.test.tsx (created) |
| 2 | Remove stale active superpowers docs | (filesystem only — files were untracked) | 8 docs/superpowers files deleted |

## Implementation Notes

### Task 1: VersionBadge State Coverage

Created `frontend/tests/features/version/VersionBadge.test.tsx` with 5 tests:
- **Loaded with commit hash**: asserts `aria-label="Application version: v1.2.3 (abcdef1)"` and text `v1.2.3 (abcdef1)` — commit is sliced to 7 chars
- **Loaded with `commit: 'none'`**: asserts `aria-label="Application version: v1.2.3"` and text `v1.2.3` with no parenthetical suffix
- **Loading (pending fetch)**: asserts container `toBeEmptyDOMElement()` and absence of any `Application version:` label — synchronous, no async needed
- **Rejected fetch**: uses `waitFor` to wait for `.catch(() => {})` to settle, then asserts empty DOM
- **Non-OK fetch**: uses `waitFor` to wait for the `r.ok ? r.json() : null` branch to settle with null, then asserts empty DOM

All tests pass: `5 passed (5)` in 589ms.

### Task 2: Stale Docs Removal

All 8 stale superpowers docs were present as untracked filesystem files (not tracked in git). Deleted directly with `rm`. Post-deletion scan confirms:
- `docs/superpowers/specs/` — empty
- `docs/superpowers/plans/` — empty
- `rg` scan for stale terms exits 0 (no matches)

## Deviations from Plan

**1. [Rule 1 - Bug] Stale docs were untracked by git**
- **Found during:** Task 2
- **Issue:** `git rm` failed because the 8 stale docs existed on the filesystem but were never staged/committed to git. The plan listed them in `files_modified` expecting git tracking.
- **Fix:** Deleted using `rm` directly. No git commit needed for the deletion — the files never existed in git history.
- **Files modified:** 8 deleted from filesystem
- **Commit:** N/A (untracked files)

## Known Stubs

None. No placeholder or stub patterns introduced in this plan.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. Test file uses synthetic fixtures only (T-09-03-03 accepted).

## Self-Check: PASSED

- `frontend/tests/features/version/VersionBadge.test.tsx`: FOUND
- Task 1 commit e6da836: confirmed via `git log`
- All 8 stale docs deleted from filesystem: confirmed via `find docs/superpowers`
- Stale terms scan: exits 0
