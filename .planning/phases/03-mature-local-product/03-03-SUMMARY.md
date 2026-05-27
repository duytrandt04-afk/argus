---
phase: 03-mature-local-product
plan: 03
subsystem: security
tags: [cors, bind, security, middleware, local-first]
requires:
  - phase: 03-mature-local-product
    plan: 02
    provides: server.Options struct and config surface
provides:
  - Strict CORS allowlist middleware replacing wildcard *
  - Remote bind opt-in gate with startup error and warning
  - Docker compatibility for HOOKER_ALLOW_REMOTE
affects: [03-mature-local-product, SEC-02, SEC-03]
tech-stack:
  added: []
  patterns:
    - CORS middleware echoes exact allowed origin and adds Vary: Origin
    - Non-loopback bind requires explicit HOOKER_ALLOW_REMOTE=1 opt-in
key-files:
  created:
    - backend/cmd/server/main_test.go
  modified:
    - backend/internal/config/config.go
    - backend/internal/server/middleware.go
    - backend/internal/server/router.go
    - backend/cmd/server/main.go
    - Dockerfile
    - backend/tests/internal/config/config_test.go
    - backend/tests/internal/server/router_test.go
key-decisions:
  - "CORS allowlist: derived from ADDR port by default, extensible via HOOKER_CORS_ORIGINS"
  - "Remote bind gate: non-loopback ADDR fails with actionable error unless HOOKER_ALLOW_REMOTE=1"
  - "Docker: HOOKER_ALLOW_REMOTE=1 set in Dockerfile with comment; compose publishes to 127.0.0.1"
patterns-established:
  - "corsAllowlist(origins) middleware in middleware.go; never use wildcard CORS"
  - "validateBind + isLoopbackHost in main.go; startup exits on ungated remote bind"
requirements-completed: [SEC-02, SEC-03]
duration: 25min
completed: 2026-05-27
---

# Phase 03 Plan 03: CORS Allowlist and Remote Bind Enforcement Summary

**Local-first security posture enforced at CORS and bind boundaries. No wildcard CORS. Non-loopback bind requires explicit opt-in.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-05-27
- **Tasks:** 2/2
- **Files modified:** 7
- **Tests:** 137 → 150 (13 new tests)

## Accomplishments

**Task 1: Replace wildcard CORS with explicit origin allowlist**

Replaced `cors(next http.Handler)` (which set `Access-Control-Allow-Origin: *`) with `corsAllowlist(origins []string)` in `backend/internal/server/middleware.go`. The new middleware:
- Echoes only origins present in the allowed set
- Adds `Vary: Origin` for all allowed-origin responses
- Rejects disallowed CORS preflights (Origin present but not allowed) with 403
- Never reflects `null`, arbitrary origins, or wildcards
- Passes non-CORS requests (no Origin header) through normally

Config extended with `CORSOrigins []string` derived from the configured ADDR port (`http://localhost:{port}`, `http://127.0.0.1:{port}`, `http://[::1]:{port}`) plus any comma-separated extras from `HOOKER_CORS_ORIGINS`. Wired through `server.Options.CORSOrigins`.

**Task 2: Enforce remote bind opt-in and Docker compatibility**

Added `AllowRemote bool` to `config.Config` (set only when `HOOKER_ALLOW_REMOTE=1`). Added three helpers to `main.go`:
- `validateBind(cfg)` — rejects non-loopback ADDR with `"refusing non-loopback ADDR ... set HOOKER_ALLOW_REMOTE=1 to enable"`
- `isLoopbackHost(host)` — recognizes `localhost`, `127.0.0.1`, `::1`, `[::1]`
- `warnRemoteBind(cfg)` — logs `slog.Warn` with captured categories (prompts, diffs, file paths, tool outputs, raw payloads, exports) and "public internet exposure is unsupported"

Empty host (`:8765`) treated as remote/wildcard — Go binds all interfaces for an empty host.

Dockerfile updated: added `HOOKER_ALLOW_REMOTE=1` alongside `ADDR=0.0.0.0:8765` with a comment explaining that `docker-compose.yml` publishes to `127.0.0.1:8765` (host loopback). The ungated silent default is gone.

## Task Commits

1. `test(03-03): add failing CORS allowlist and bind validation tests` — RED phase
2. `feat(03-03): enforce CORS allowlist and remote-bind opt-in` — GREEN phase

## Files Created/Modified

- `backend/internal/config/config.go` — added `CORSOrigins`, `AllowRemote`, `defaultCORSOrigins()`, `parseCORSOrigins()`
- `backend/internal/server/middleware.go` — replaced wildcard `cors` with `corsAllowlist`
- `backend/internal/server/router.go` — added `CORSOrigins` to `Options`, wired `corsAllowlist`
- `backend/cmd/server/main.go` — added `validateBind`, `isLoopbackHost`, `warnRemoteBind`, startup call
- `Dockerfile` — added `HOOKER_ALLOW_REMOTE=1` with comment
- `backend/cmd/server/main_test.go` — new: `validateBind` and `isLoopbackHost` tests
- `backend/tests/internal/config/config_test.go` — added CORS origins and AllowRemote tests
- `backend/tests/internal/server/router_test.go` — updated to test allowlist behavior

## Decisions Made

- CORS origins derived from ADDR port by default; `HOOKER_CORS_ORIGINS` extends the allowlist
- Only `HOOKER_ALLOW_REMOTE=1` (not `true`, `yes`, etc.) enables remote bind — intentionally strict
- Empty host `:8765` is remote/wildcard — Go listens on all interfaces
- Docker sets both `ADDR=0.0.0.0:8765` and `HOOKER_ALLOW_REMOTE=1`; compose controls external exposure via `ports: "127.0.0.1:8765:8765"`

## Verification

- `go test ./... -count=1`: 150 passed, 0 failed
- `go build ./...`: success
- `go vet ./...`: no issues
- Source: `middleware.go` contains no `Access-Control-Allow-Origin: *`
- Source: `main.go` contains `refusing non-loopback ADDR` and `HOOKER_ALLOW_REMOTE=1`
- Source: `main.go` warning contains `prompts, diffs, file paths, tool outputs, raw payloads, exports` and `unsupported`
- Source: `Dockerfile` has `HOOKER_ALLOW_REMOTE=1` alongside `ADDR=0.0.0.0:8765`

## Deviations from Plan

None. `golangci-lint` not installed in environment; `go vet` used instead, no issues found.

## Self-Check: PASSED

- `backend/internal/server/middleware.go` contains `Vary` ✓
- `backend/internal/config/config.go` contains `HOOKER_ALLOW_REMOTE` ✓
- `backend/cmd/server/main.go` contains `refusing non-loopback ADDR` and `HOOKER_ALLOW_REMOTE=1` ✓
- `Dockerfile` no longer has ungated `ADDR=0.0.0.0:8765` without remote flag ✓
- 150 tests passing ✓
