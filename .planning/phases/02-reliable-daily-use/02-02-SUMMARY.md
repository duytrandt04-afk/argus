---
phase: 02-reliable-daily-use
plan: "02"
subsystem: backend/ingestion
tags: [degraded-ingestion, normalization, slog, tdd, MODEL-04]
dependency_graph:
  requires:
    - migration-008-normalization-fields
    - domain-normalization-fields
  provides:
    - degraded-ingestion-path
    - normalizer-version-constants
    - slog-migration-hook
  affects:
    - backend/internal/handler/hook.go
    - backend/internal/agents/claudecode/claudecode.go
    - backend/internal/agents/codex/codex.go
    - backend/internal/agents/geminicli/geminicli.go
tech_stack:
  added:
    - crypto/sha256 (raw dedup key for degraded events)
    - log/slog (structured logging replacing bare log in hook.go)
  patterns:
    - Degraded ingestion — isDegraded check (parse error OR empty session+hook_event+tool) constructs minimal NormalizedEvent rather than returning HTTP 400
    - SHA256 dedup prefix — "degraded-<hex[:16]>" for Session field prevents INSERT OR IGNORE collisions across distinct unknown payloads
    - Per-agent NormalizerVersion constant — package-level const set in each Normalize() return literal
key_files:
  created: []
  modified:
    - backend/internal/handler/hook.go
    - backend/internal/agents/claudecode/claudecode.go
    - backend/internal/agents/codex/codex.go
    - backend/internal/agents/geminicli/geminicli.go
    - backend/tests/internal/handler/hook_test.go
    - backend/tests/internal/agents/claudecode/normalize_test.go
    - backend/tests/internal/agents/codex/normalize_test.go
    - backend/tests/internal/agents/geminicli/normalize_test.go
decisions:
  - "isDegraded check uses both normalizeErr != nil AND empty session+hook_event+tool — agents accept any valid JSON without error, so the empty-field check is needed to catch truly unrecognized payloads"
  - "degraded Session prefix uses SHA256 hex[:16] of raw bytes — 16 hex chars = 64 bits of uniqueness, sufficient for dedup while keeping the Session field short"
  - "NormalizerVersion set in the Normalize() return literal (not after-the-fact in hook.go) — keeps the version close to the normalization logic and avoids a second mutation step"
  - "AgentVersion="" documented as intentional empty best-effort field per MODEL-03 with a comment explaining what would fill it in future"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-26"
  tasks_completed: 2
  files_changed: 8
---

# Phase 2 Plan 02: Degraded Ingestion and NormalizerVersion Summary

Wired degraded ingestion mode into hook.go (MODEL-04): unknown payloads are stored with normalization_status="degraded" and a SHA256-based dedup key instead of being dropped with HTTP 400. Added NormalizerVersion constants to all three agent Normalize() functions and migrated hook.go logging from bare "log" to "log/slog".

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| TDD RED | Failing tests for NormalizerVersion + degraded ingestion | 680d9d4 | 4 test files (+6 failing tests) |
| Task 1 GREEN | NormalizerVersion constants in all three agents | a6cdbc3 | claudecode.go, codex.go, geminicli.go |
| Task 2 GREEN | Degraded ingestion path in hook.go | 467b7b2 | hook.go |

## What Was Built

**Degraded ingestion path** (`hook.go`): On normalization failure (parse error) OR completely unrecognized payload (empty session+hook_event+tool), constructs a minimal `NormalizedEvent` with `NormalizationStatus="degraded"`, `Agent="unknown"`, `NormalizerVersion="hooker/1"`, and `Session="degraded-<sha256hex[:16]>"`. The SHA256 prefix ensures two different unknown payloads produce distinct INSERT OR IGNORE dedup keys. Previously these returned HTTP 400 — they are now stored.

**NormalizerVersion constants**: Each agent's `Normalize()` function now sets `e.NormalizerVersion` to a per-agent constant (`"claudecode/1"`, `"codex/1"`, `"geminicli/1"`) in the return literal. The `ok` path in hook.go sets `NormalizationStatus="ok"` and leaves `NormalizerVersion` as-is from the agent.

**slog migration** (`hook.go`): All `log.Printf`/`log.Printf` calls replaced with `slog.Info`, `slog.Warn`, `slog.Error`. The bare `"log"` import is gone; `"log/slog"` is used throughout.

**AgentVersion documentation**: The `e.AgentVersion` field is explicitly acknowledged in hook.go with a comment explaining it remains `""` intentionally (neither Claude Code nor Codex expose a version field in hook payloads). A note documents what future code would set it to (MODEL-03).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] isDegraded check expanded to cover unrecognized payloads, not just parse errors**
- **Found during:** Task 2 GREEN (test run)
- **Issue:** The plan's interfaces section assumed `normalizeErr != nil` would be triggered by unknown payloads. In practice, all three agent `Normalize()` functions accept any valid JSON without error (they parse into `domain.RawPayload` which is a lenient struct). `normalizeErr` is only non-nil for malformed JSON — which is already caught by the earlier `meta` unmarshal step. This made the degraded path unreachable.
- **Fix:** Added `isDegraded := normalizeErr != nil || (e.Session == "" && e.HookEventName == "" && e.Tool == "")`. This catches both the theoretical parse-error case and the real-world unrecognized-payload case.
- **Files modified:** `backend/internal/handler/hook.go`
- **Commit:** 467b7b2

## TDD Gate Compliance

RED gate: commit 680d9d4 (`test(02-02): add failing tests...`) — 6 tests failing
GREEN gate: commits a6cdbc3 + 467b7b2 — all 88 tests passing

## Self-Check: PASSED

Files present:
- backend/internal/handler/hook.go: FOUND
- backend/internal/agents/claudecode/claudecode.go: FOUND (NormalizerVersion constant)
- backend/internal/agents/codex/codex.go: FOUND (NormalizerVersion constant)
- backend/internal/agents/geminicli/geminicli.go: FOUND (NormalizerVersion constant)

Commits present:
- 680d9d4: FOUND (RED test commit)
- a6cdbc3: FOUND (Task 1 GREEN)
- 467b7b2: FOUND (Task 2 GREEN)

Build+test: go build ./... && go test ./... — 88 passed, 0 failed
Lint: golangci-lint v2 — 0 issues
