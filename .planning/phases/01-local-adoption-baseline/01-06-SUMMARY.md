---
phase: 01-local-adoption-baseline
plan: 06
subsystem: ui
tags: [react, typescript, sidebar, runtime-version, vitest]
requires:
  - phase: 01-02
    provides: "GET /api/version response shape for runtime version display"
provides:
  - "Runtime-fetched version badge rendered in sidebar footer"
  - "Removal of Vite-baked APP_VERSION frontend constant usage"
  - "Collapsed-sidebar behavior hides version element entirely"
affects: [diagnostics, frontend-navigation, local-adoption]
tech-stack:
  added: []
  patterns: ["Feature-local hook+component for runtime metadata fetch and display"]
key-files:
  created: [.planning/phases/01-local-adoption-baseline/01-06-SUMMARY.md, frontend/src/features/version/useVersion.ts, frontend/src/features/version/VersionBadge.tsx]
  modified: [frontend/src/app/Sidebar.tsx, frontend/tests/app/Sidebar.desktop.test.tsx]
key-decisions:
  - "Version badge fetches /api/version once on mount and omits UI during loading/error."
  - "Runtime version display moved from header to footer and hidden when sidebar is collapsed."
patterns-established:
  - "Operational metadata should be runtime-fetched rather than Vite define-time constants."
requirements-completed: [DIAG-04]
duration: 7min
completed: 2026-05-24
---

# Phase 01 Plan 06: Frontend Runtime Version Badge Summary

**Sidebar now renders runtime `/api/version` output as a footer badge (`vX.Y.Z (abcdefg)`), with static APP_VERSION removed and collapsed/loading/error states rendering nothing.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-24T18:37:00+07:00
- **Completed:** 2026-05-24T11:42:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `useVersion` hook that fetches `GET /api/version` once with mounted-guarded state updates.
- Added `VersionBadge` component with D-06 formatting and ARIA label.
- Replaced sidebar static header version with footer placement guarded by `!collapsed`.
- Removed `frontend/src/version.ts` and updated desktop sidebar test to align with runtime-loading behavior.

## Task Commits

1. **Task 1: Create useVersion hook and VersionBadge component** - `185f18c` (feat)
2. **Task 2: Update Sidebar.tsx and delete version.ts** - `8740d10` (feat)

## Files Created/Modified

- `frontend/src/features/version/useVersion.ts` - runtime version fetch hook.
- `frontend/src/features/version/VersionBadge.tsx` - footer version label renderer.
- `frontend/src/app/Sidebar.tsx` - integrates `VersionBadge` in footer and removes header static version.
- `frontend/tests/app/Sidebar.desktop.test.tsx` - removes stale static version assertion.
- `frontend/src/version.ts` - deleted obsolete build-time version constant.

## Decisions Made

- Kept loading/error states silent (`null`) to avoid placeholder noise for informational metadata.
- Kept commit suffix conditional (`(abcdefg)` only when commit is not `"none"`), matching plan/UI spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated stale sidebar test expecting removed static version text**
- **Found during:** Task 2
- **Issue:** `Sidebar.desktop.test.tsx` still asserted `v0.0.0-dev` from removed `APP_VERSION`.
- **Fix:** Replaced assertion with absence check for version label before runtime fetch resolves.
- **Files modified:** `frontend/tests/app/Sidebar.desktop.test.tsx`
- **Verification:** `cd frontend && npx vitest run` passed (51 tests).
- **Committed in:** `8740d10` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Necessary test alignment for new runtime behavior; no scope expansion.

## Issues Encountered

- Initial Prettier invocation failed due sandbox DNS resolution for npm registry. Retried via `rtk npx prettier --write` in `frontend/`, which succeeded.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DIAG-04 frontend runtime-version requirement is complete and verified by typecheck and test suite.
- Frontend now consumes runtime version endpoint and no longer depends on Vite-defined version constant.

## Self-Check: PASSED

- Verified summary file exists.
- Verified task commits `185f18c` and `8740d10` exist in git history.
