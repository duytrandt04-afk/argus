---
phase: 03-mature-local-product
plan: 05
subsystem: docs
tags: [contributing, adr, sqlite, normalization, local-first, proxy]

requires:
  - phase: 02-reliable-daily-use
    provides: raw payload storage, normalization metadata, export behavior, and regression tests
provides:
  - Practical contributor guide covering project structure, layer boundaries, adapter rules, DB field guidance, and contract checklist
  - Accepted ADRs for SQLite storage, hook normalization, local-first positioning, and proxy scope
affects: [contributor-infrastructure, adapter-changes, frontend-backend-contracts, architecture-docs]

tech-stack:
  added: []
  patterns:
    - Lightweight ADR files under docs/adr/
    - Contributor checklist for frontend-backend contract changes

key-files:
  created:
    - docs/adr/0001-sqlite-local-storage.md
    - docs/adr/0002-hook-normalization-strategy.md
    - docs/adr/0003-local-first-positioning.md
    - docs/adr/0004-proxy-scope.md
  modified:
    - CONTRIBUTING.md

key-decisions:
  - "Contributor guide is practical and checklist-driven instead of a full architecture manual."
  - "ADRs use a lightweight accepted format with Status, Date, Context, Decision, and Consequences."

patterns-established:
  - "Adapter changes require a fixture payload and normalization test under backend/tests/internal/agents/<agent>/."
  - "Frontend-backend contract changes must update Go domain JSON tags, TypeScript types, fixtures, backend tests, frontend tests, and CI proof together."

requirements-completed: [CONTRIB-01, CONTRIB-02, CONTRIB-03]

duration: 4min
completed: 2026-05-27
---

# Phase 03 Plan 05: Contributor Guide and ADRs Summary

**Contributor guardrails now document safe adapter, database, contract, local-first, and proxy changes with accepted ADRs for the core architecture decisions.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-27T04:24:47Z
- **Completed:** 2026-05-27T04:27:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Expanded `CONTRIBUTING.md` into a practical contributor path with pnpm commands, project structure, backend layer boundaries, frontend locations, common change flows, DB column guidance, adapter steps, and frontend-backend contract checklist.
- Added four accepted ADRs under `docs/adr/` for SQLite local storage, hook normalization strategy, local-first positioning, and proxy scope.
- Preserved local-first and unsupported remote sharing boundaries in contributor and ADR documentation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand the practical contributor guide** - `5e3c41f` (docs)
2. **Task 2: Add accepted ADRs for core product decisions** - `ef0a8aa` (docs)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `CONTRIBUTING.md` - Practical contributor guide covering setup, boundaries, adapter rules, DB guidance, and frontend-backend contract checklist.
- `docs/adr/0001-sqlite-local-storage.md` - Accepted SQLite local storage decision.
- `docs/adr/0002-hook-normalization-strategy.md` - Accepted in-tree adapter and normalization test decision.
- `docs/adr/0003-local-first-positioning.md` - Accepted local-first product positioning decision.
- `docs/adr/0004-proxy-scope.md` - Accepted local proxy scope decision.

## Decisions Made

- Contributor guidance stays checklist-driven and concise, with links to concrete source files rather than duplicating the full architecture map.
- ADRs use a lightweight accepted format because the project did not have an existing ADR template.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - this plan only changed contributor and architecture documentation. It did not add endpoints, auth paths, file access, schema changes, or new trust boundaries.

## Verification

- `rtk rg -n 'pnpm|handler|service|repository|backend/internal/domain/event.go|frontend/src/types/events.ts|fixture payload|normalization test|DB column|raw payload|Frontend-backend contract' CONTRIBUTING.md` passed.
- `rtk rg -n 'Status: Accepted|Date: 2026-05-27|## Context|## Decision|## Consequences|fixture|NormalizedEvent|local-first|proxy' docs/adr` passed.
- `rtk rg -n 'fixture payload|normalization test|backend/internal/domain/event.go|frontend/src/types/events.ts|Status: Accepted|local-first|proxy' CONTRIBUTING.md docs/adr` passed.
- Stub scan across `CONTRIBUTING.md docs/adr` found no `TODO`, `FIXME`, placeholder, or empty hardcoded UI data patterns.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/03-mature-local-product/03-05-SUMMARY.md`.
- Task commit `5e3c41f` exists.
- Task commit `ef0a8aa` exists.
- Created ADR files exist under `docs/adr/`.
- Plan-level verification passed.

## Next Phase Readiness

Ready for remaining Phase 03 plans. Contributor docs now define the adapter and contract guardrails that future privacy-ignore and CORS/bind work should follow.

---
*Phase: 03-mature-local-product*
*Completed: 2026-05-27*
