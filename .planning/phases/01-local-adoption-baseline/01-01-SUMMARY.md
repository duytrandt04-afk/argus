---
phase: 01
plan: 01
subsystem: backend
tags: [security, diagnostics, repository]
requires: []
provides: [SEC-01, DIAG-01, DIAG-02]
affects:
  - backend/internal/server/middleware.go
  - backend/internal/server/router.go
  - backend/internal/repository/repository.go
  - backend/internal/repository/sqlite/sqlite.go
  - backend/tests/internal/service/event_service_test.go
tech_stack:
  added: []
  patterns: [http-middleware, readiness-probe, atomic-ready-flag]
decisions:
  - "Wire host header validation outermost to enforce localhost-only access before other middleware."
metrics:
  started_at: "2026-05-24T10:15:00Z"
  completed_at: "2026-05-24T10:22:00Z"
---

# Phase 01 Plan 01: Localhost Host-Guard + Readiness Contract Summary

Implemented localhost Host-header enforcement and readiness plumbing in repository/router layers to close DNS rebinding exposure and support `/readyz` wiring.

## Completed Tasks

1. Task 1: Added `hostHeader` middleware with localhost allowlist, updated router signature to accept `ready func() bool`, registered `/healthz` and `/readyz`, and wrapped router with `hostHeader(cors(logging(mux)))`.
2. Task 2: Added `Ready() bool` to `EventRepository`, added sqlite `atomic.Bool` readiness flag with post-migration set, and updated service test mock implementation.

## Verification

- `rg` checks confirmed:
  - `func hostHeader(next http.Handler) http.Handler`
  - `hostHeader(cors(logging(mux)))`
  - `GET /healthz`, `GET /readyz`
  - `ready func() bool`
  - `Ready() bool` on interface/mock and sqlite implementation
  - sqlite `atomic.Bool` and `d.ready.Store(true)`
- `go test` results:
  - `go test ./tests/internal/service/...` passed
  - `go test ./internal/repository/...` passed
  - `go test ./internal/server/...` fails as expected until Plan 01-02 adds `handler.Healthz` and `handler.Readyz`

## Deviations from Plan

None - plan executed as written.

## Auth Gates

None.

## Known Stubs

None.

## Self-Check: PASSED

- Found summary file: `.planning/phases/01-local-adoption-baseline/01-01-SUMMARY.md`
- Found task commit `8446fb8`
- Found task commit `53a556c`
