---
phase: 03-mature-local-product
plan: 02
subsystem: privacy
tags: [privacy, gitignore, ignore-matcher, ingestion-gate, sse]
requires:
  - phase: 03-mature-local-product
    provides: "03-01 matcher decision: internal matcher (no go get)"
provides:
  - Internal gitignore-style matcher for hook ingestion filtering
  - Config surface for HOOKER_IGNORE env var
  - Privacy gate in hook handler before persistence and SSE broadcast
affects: [03-mature-local-product, PRIV-01, hook-ingestion, config, privacy-ignore]
tech-stack:
  added: []
  patterns:
    - Internal gitignore-style matcher with no third-party dependency
    - IgnoreMatcher interface on handler.Hook for testability
    - server.Options struct for extensible router configuration
key-files:
  created:
    - backend/internal/privacy/ignore/ignore.go
    - backend/internal/privacy/ignore/ignore_test.go
  modified:
    - backend/internal/config/config.go
    - backend/internal/handler/hook.go
    - backend/internal/server/router.go
    - backend/cmd/server/main.go
    - backend/tests/internal/config/config_test.go
    - backend/tests/internal/handler/hook_test.go
    - backend/tests/internal/server/router_test.go
    - backend/tests/internal/handler/export_test.go
key-decisions:
  - "Matched events: return 200/{}, no DB row, no SSE broadcast (D-03)"
  - "Privacy gate positioned after enrichContext, before SessionModel/slog/AddEvent"
  - "IgnoreMatcher interface injected into handler.Hook for testability"
  - "server.Options struct carries matcher to avoid threading unrelated params"
  - "Missing default ignore file is empty matcher, not an error (D-01)"
decisions:
  - "Internal matcher implements D-05 semantics: blank lines, comments, !, directory patterns, ** globs"
  - "Reason string is pattern+line metadata only; no sensitive field values logged (D-04)"
  - "Only CWD and Path evaluated; Prompt/Command/OldString/NewString/ToolResultStdout/RawPayload never read"
patterns-established:
  - "IgnoreMatcher interface allows stub injection in tests (matchAllMatcher, matchNoneMatcher)"
  - "server.Options struct pattern for adding router config without parameter sprawl"
requirements-completed: [PRIV-01]
duration: 22min
completed: 2026-05-27
---

# Phase 03 Plan 02: Gitignore Privacy Gate Summary

**Internal gitignore-style matcher gates hook ingestion so matched CWD/Path events are never stored or streamed, with metadata-only logs.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-05-27T06:31:55Z
- **Completed:** 2026-05-27
- **Tasks:** 2
- **Files modified/created:** 9

## Accomplishments

- Created `backend/internal/privacy/ignore` package with `Load()` and `Matcher.MatchEvent()`.
- Implemented D-05 semantics internally: blank lines, `#` comments, `!` negation, directory patterns (trailing `/`), `**` multi-segment glob, `*` single-segment glob.
- Matching evaluates only `domain.NormalizedEvent.CWD` and `domain.NormalizedEvent.Path` (D-02).
- Reason string returned by `MatchEvent` is pattern+line metadata only — no sensitive field values (D-04).
- Missing default ignore file returns empty matcher without error (D-01 / T-03-02-04 safe path).
- Unreadable explicit `HOOKER_IGNORE` path causes `main.go` to exit with actionable `slog.Error`.
- Extended `config.Config` with `IgnorePath string` loaded from `HOOKER_IGNORE` env var; default is `~/.config/hooker/ignore`.
- Added privacy gate in `handler.Hook` after `enrichContext(e)` and before `svc.SessionModel`, `slog.Info("hook")`, and `svc.AddEvent` (D-03, T-03-02-01).
- Ignored events return HTTP 200 `{}` with `Content-Type: application/json`.
- Ignored events log only `agent`, `session`, `action`, and `reason` — no `path`, `prompt`, `command`, `old_string`, `new_string`, `raw`, `stdout`, or `stderr` (D-04, T-03-02-02).
- Introduced `handler.IgnoreMatcher` interface for handler testability.
- Introduced `server.Options` struct to carry matcher to `NewRouter` without widening the parameter list.
- Updated `main.go` to call `ignore.Load(cfg.IgnorePath)` and pass matcher via `server.Options`.
- 137 tests passing (up from 105); 32 new tests covering all D-01 through D-05 contract points.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED** - `test(03-02): add failing tests for internal gitignore matcher`
2. **Task 1 GREEN** - `feat(03-02): implement internal gitignore matcher and IgnorePath config`
3. **Task 2 RED** - `test(03-02): add failing tests for hook privacy gate`
4. **Task 2 GREEN** - `feat(03-02): gate hook ingestion before persistence and SSE`

## Files Created/Modified

- `backend/internal/privacy/ignore/ignore.go` — Matcher, Load(), MatchEvent(), internal gitignore semantics
- `backend/internal/privacy/ignore/ignore_test.go` — 27 tests covering all D-05 semantics and D-02/D-04 constraints
- `backend/internal/config/config.go` — Added `IgnorePath string`, `HOOKER_IGNORE` env loading, `defaultIgnorePath()`
- `backend/internal/handler/hook.go` — Added `IgnoreMatcher` interface; Hook() accepts matcher; privacy gate inserted
- `backend/internal/server/router.go` — Added `Options` struct with `Matcher` field; `allowNone` default; NewRouter updated
- `backend/cmd/server/main.go` — Added `ignore.Load(cfg.IgnorePath)` at startup; error-exits on I/O failure
- `backend/tests/internal/config/config_test.go` — Added `TestLoad_IgnorePath_Default` and `TestLoad_IgnorePath_EnvOverride`
- `backend/tests/internal/handler/hook_test.go` — Added `matchAllMatcher`, `matchNoneMatcher`, 3 ignore-gate tests; updated all Hook() calls
- `backend/tests/internal/server/router_test.go` — Updated `newTestRouter()` for new `server.Options{}` signature
- `backend/tests/internal/handler/export_test.go` — Updated `newRouterWithRepo()` for new `server.Options{}` signature

## Decisions Made

- Privacy gate positioned after `enrichContext(e)` so CWD/Path are canonical before matching.
- `server.Options` struct (not a standalone parameter) so future CORS or other config can be added without widening the signature.
- `IgnoreMatcher` interface in the `handler` package (not `privacy/ignore`) to avoid a circular dependency between handler and the matcher package.

## Deviations from Plan

None - plan executed exactly as written. The 03-01 checkpoint decision to use an internal matcher was followed; `go get` was not run.

## Issues Encountered

None.

## User Setup Required

Users can create `~/.config/hooker/ignore` with gitignore-style patterns to exclude paths from being ingested. Set `HOOKER_IGNORE=/path/to/file` to override the default location. Missing file is safe (no events ignored). Example:

```
# Ignore personal projects
/home/alice/personal/
# Ignore generated build output
**/dist/
# Ignore node_modules everywhere
node_modules/
```

## Known Stubs

None.

## Threat Flags

None — implementation addresses all threats from T-03-02-01 through T-03-02-SC registered in the plan threat model.

## Verification

- `cd backend && go test ./... -count=1` — 137 passed in 26 packages.
- `cd backend && go build ./...` — success.
- `cd backend && go vet ./...` — no issues.
- Source assertion: `backend/internal/config/config.go` contains `IgnorePath string` and `HOOKER_IGNORE`.
- Source assertion: `backend/internal/privacy/ignore/ignore.go` contains `MatchEvent(e domain.NormalizedEvent)`.
- Source assertion: matcher references `e.CWD` and `e.Path`; no reference to `Prompt`, `ToolResultStdout`, `OldString`, `NewString`, or `RawPayload`.
- Source assertion: `backend/internal/handler/hook.go` evaluates `MatchEvent` at line 95, before `SessionModel` (line 105), `slog.Info("hook")` (line 117), and `svc.AddEvent` (line 119).
- Source assertion: `hook ignored` log fields are `agent`, `session`, `action`, `reason` only.
- Test assertion: `TestHookIgnoredEventStoresNoRows` verifies `ListEvents(10)` length is 0.
- Test assertion: `TestHookIgnoredEventNoSSEBroadcast` subscribes before POST and verifies no channel receive.

## Self-Check: PASSED

- Found `backend/internal/privacy/ignore/ignore.go`.
- Found `backend/internal/privacy/ignore/ignore_test.go`.
- Found `backend/internal/config/config.go` with `IgnorePath`.
- Found `backend/internal/handler/hook.go` with `IgnoreMatcher` interface and gate.
- Confirmed 137 tests pass.
- Confirmed `go build ./...` succeeds.
