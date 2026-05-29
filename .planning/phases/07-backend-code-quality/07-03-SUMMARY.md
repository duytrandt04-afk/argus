---
phase: 07-backend-code-quality
plan: "03"
subsystem: backend/handler
tags: [observability, error-handling, logging, handler]
dependency_graph:
  requires: [parsePageSize-helper]
  provides: [handler-encode-observability]
  affects:
    - backend/internal/handler/dashboard.go
    - backend/internal/handler/diagnostics.go
    - backend/internal/handler/events.go
    - backend/internal/handler/file_changes.go
    - backend/internal/handler/projects.go
    - backend/internal/handler/sessions.go
    - backend/internal/handler/sessions_tree.go
    - backend/internal/handler/traces.go
    - backend/internal/handler/usage.go
    - backend/internal/handler/version.go
tech_stack:
  added: []
  patterns: [if-err-encode, log.Printf-handler-format]
key_files:
  created: []
  modified:
    - backend/internal/handler/dashboard.go
    - backend/internal/handler/diagnostics.go
    - backend/internal/handler/events.go
    - backend/internal/handler/file_changes.go
    - backend/internal/handler/projects.go
    - backend/internal/handler/sessions.go
    - backend/internal/handler/sessions_tree.go
    - backend/internal/handler/traces.go
    - backend/internal/handler/usage.go
    - backend/internal/handler/version.go
decisions:
  - "map literal encode args assigned to local var `resp` so %T prints the concrete Go type cleanly"
  - "function-call encode args (ComputeUsage) assigned to local var `result` before encode for the same reason"
  - "anonymous struct in version.go assigned to local var `v` before encode"
  - "golangci-lint not installed in environment; go vet substituted (same as plan 07-01 deviation)"
metrics:
  duration: "~3 min"
  completed: "2026-05-29"
  tasks_completed: 1
  files_changed: 10
---

# Phase 7 Plan 03: Handler Encode Observability Summary

**One-liner:** Replaced all 14 suppressed `_ = json.NewEncoder(w).Encode(v)` calls across 10 handler files with if-err blocks logging `[handler] encode %T: %v` — JSON encode failures are now observable in logs.

## What Was Built

Every handler file that previously silently discarded JSON encode errors now logs a structured line on failure. The pattern applied uniformly across all 14 sites:

```go
// Before
_ = json.NewEncoder(w).Encode(v)

// After
if err := json.NewEncoder(w).Encode(v); err != nil {
    log.Printf("[handler] encode %T: %v", v, err)
}
```

Files updated with encode counts:

| File | Sites | Encoded values |
|------|-------|----------------|
| dashboard.go | 1 | `stats` (*domain.DashboardStats) |
| diagnostics.go | 1 | `diagnostics` (service.DiagnosticsResult) |
| events.go | 1 | `resp` (map[string]any{"events": events}) |
| file_changes.go | 1 | `groups` ([]domain.FileChangeGroup) |
| projects.go | 1 | `resp` (map[string]any{"projects": projects}) |
| sessions.go | 2 | `resp` (paginated map) + `sessions` ([]domain.Session) |
| sessions_tree.go | 1 | `resp` (map[string]any{"sessions": tree}) |
| traces.go | 2 | `resp` (paginated map) + `resp` (map[string]any{"traces": traces}) |
| usage.go | 3 | `result` for claudecode, geminicli, codex ComputeUsage returns |
| version.go | 1 | `v` (anonymous struct with Version/Commit/BuildDate) |

`"log"` was added to the import block of all 10 files (stdlib group, alphabetical after `"encoding/json"`).

For map literal args and function-call return values, the value was first assigned to a named local variable so `%T` in the log call reflects the concrete Go type rather than an unresolved inline expression.

## Verification Results

- `grep -rn '_ = json.NewEncoder' internal/handler/` — no matches (PASS)
- `grep -c 'log.Printf.*\[handler\] encode'` across all 10 files — 14 matches (PASS)
- `go build ./...` — passed with no errors
- `go test ./...` — 182 tests passed across 28 packages
- `go vet ./...` — no issues

## Deviations from Plan

### Tooling Note

**golangci-lint not installed:** Same environment gap as plan 07-01. The `golangci-lint run ./...` command failed with "No such file or directory". Substituted `go vet ./...` which passed cleanly. `go build` and `go test` both passed. No code changes required.

## Known Stubs

None. No placeholder data or stub patterns introduced.

## Threat Flags

None. Changes are log-only on the encode error path. The log line prints the Go type name (`%T`) and the error string (`%v`) — not the encoded payload content. No user data, PII, or secrets are written to the log. No new network endpoints, auth paths, file access patterns, or schema changes were introduced.

## Self-Check: PASSED

- Commit `7d74939` — all 10 handler files
- `grep -rn '_ = json.NewEncoder' internal/handler/` — no matches
- 14 `log.Printf("[handler] encode %T: %v"` lines confirmed across 10 files
- `go build ./...` — passed
- `go test ./...` — 182/182 passed
