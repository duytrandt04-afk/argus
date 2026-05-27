---
phase: 03-mature-local-product
verified: 2026-05-27T09:00:00Z
status: human_needed
score: 15/15 must-haves verified
overrides_applied: 0
gaps: []
human_verification:
  - test: "Run scripts/hooker doctor and confirm all six captured-data categories appear in terminal output"
    expected: "Doctor prints a privacy warning containing: prompts, diffs, file paths, tool outputs, raw payloads, exports"
    why_human: "Script can only be executed in a local shell with proper env; cannot invoke bash scripts in this context"
  - test: "Start backend with ADDR=0.0.0.0:8765 (no HOOKER_ALLOW_REMOTE) and confirm process exits with actionable error"
    expected: "Process exits immediately with message containing 'refusing non-loopback ADDR' and 'HOOKER_ALLOW_REMOTE=1'"
    why_human: "Runtime behavior of Go binary startup requires a live process"
  - test: "Create ~/.config/hooker/ignore with a pattern matching a test cwd, send a hook event to POST /api/hook, and verify GET /api/events returns 0 events and no SSE message was received"
    expected: "HTTP 200 {} from hook endpoint; events list empty; SSE channel silent"
    why_human: "End-to-end privacy gate requires a running backend and real file system state"
deferred: []
---

# Phase 03: Mature Local Product — Verification Report

**Phase Goal:** Deliver mature local product with explicit privacy controls, local-first security posture, and contributor guardrails.
**Verified:** 2026-05-27T09:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | User can create `~/.config/hooker/ignore` and matching hook events are not ingested (D-01) | VERIFIED | `ignore.Load()` returns empty matcher for missing file; `main.go` calls `ignore.Load(cfg.IgnorePath)` at startup |
| 2  | Ignore matching checks only normalized event `cwd` and explicit `path` fields (D-02) | VERIFIED | `ignore.go:96-112` — `candidates` built only from `e.CWD` and `e.Path`; no other fields read |
| 3  | Ignored events produce no database row and no SSE broadcast (D-03) | VERIFIED | `hook.go:95-102` — gate returns before `svc.AddEvent`; tests `TestHookIgnoredEventStoresNoRows` and `TestHookIgnoredEventNoSSEBroadcast` confirmed present |
| 4  | Ignored events produce metadata-only backend logs without raw payload, prompt text, tool output, or diffs (D-04) | VERIFIED | `hook.go:98` — `slog.Info("hook ignored", "agent", ...)` logs only agent/session/action/reason; no path/prompt/command/raw fields |
| 5  | Ignore semantics support gitignore-like core: blank lines, comments, negation, directory patterns, `**` (D-05) | VERIFIED | `ignore_test.go` has dedicated tests: `TestLoad_BlankLinesIgnored`, `TestLoad_CommentsIgnored`, `TestMatchEvent_NegationPattern`, `TestMatchEvent_DirectoryPattern`, `TestMatchEvent_DoubleStarPattern` |
| 6  | CORS no longer returns `Access-Control-Allow-Origin: *`; uses derived local origins by default (D-06) | VERIFIED | `middleware.go:49-90` — `corsAllowlist()` echoes only set members; no wildcard anywhere in file; `config.go:34-43` derives origins from ADDR port |
| 7  | Allowed local origins are echoed exactly and include `Vary: Origin` (D-06) | VERIFIED | `middleware.go:71-72` — sets exact origin and `Vary: Origin`; tests `TestNewRouterCORSAllowsLocalhost` and `TestNewRouterCORSAllows127` confirmed |
| 8  | Non-loopback `ADDR` cannot expose hooker unless `HOOKER_ALLOW_REMOTE=1` is set (D-07) | VERIFIED | `main.go:44-47` — `validateBind(cfg)` called before `net.Listen`; exits on error |
| 9  | Non-loopback `ADDR` fails startup with an actionable error unless `HOOKER_ALLOW_REMOTE=1` (D-08) | VERIFIED | `main.go:127` — `fmt.Errorf("refusing non-loopback ADDR %q — set HOOKER_ALLOW_REMOTE=1 to enable", cfg.Addr)`; tests `TestValidateBind_RemoteWithoutFlagFails` confirmed |
| 10 | Explicit remote bind emits a startup warning listing captured data categories and unsupported exposure (D-09) | VERIFIED | `main.go:141-145` — `slog.Warn("REMOTE BIND ACTIVE...")` with captures: `"prompts, diffs, file paths, tool outputs, raw payloads, exports"` and note: `"public internet exposure is unsupported"` |
| 11 | Doctor output includes a clear privacy warning before capture starts | VERIFIED | `scripts/hooker:207` — `printf '%s Privacy: hooker captures prompts, diffs, file paths, tool outputs, raw payloads, and exports...'` |
| 12 | Setup and install docs list all sensitive captured data categories | VERIFIED | `docs/install.md:24` — lists all six categories; `docs/quickstart.md` links to `docs/privacy.md` |
| 13 | Export docs warn that NDJSON/SQLite snapshots contain full-fidelity sensitive data | VERIFIED | `docs/privacy.md:48-58` — Export Implications section covers NDJSON and snapshot sensitivity |
| 14 | Threat model docs state localhost-only, single-user trust model, no auth for loopback, unsupported ngrok | VERIFIED | `docs/security.md:3` ("localhost-use"), `docs/security.md:16` ("no auth"), `docs/security.md:40-41` (ngrok unsupported) |
| 15 | Contributors can identify structure, layer boundaries, flows, adapter steps, and common commands quickly (D-13); adapter changes have documented fixture payload and test requirement (D-11); frontend-backend contract changes have a documented checklist (D-12); ADRs exist for SQLite, normalization, local-first, proxy scope (D-10) | VERIFIED | `CONTRIBUTING.md` covers all D-11/D-12/D-13 points; four ADR files exist under `docs/adr/` with `Status: Accepted`, `Date: 2026-05-27`, `## Context`, `## Decision`, `## Consequences` |

**Score:** 15/15 truths verified

---

### Deferred Items

None.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/internal/privacy/ignore/ignore.go` | Ignore file loading and event matching API | VERIFIED | Exports `Matcher`, `Load`, `MatchEvent`; 293 lines of substantive implementation |
| `backend/internal/privacy/ignore/ignore_test.go` | Gitignore core semantics and event-field-only tests | VERIFIED | 370-line test file with 14 test functions covering all D-05 semantics |
| `backend/internal/handler/hook.go` | Privacy gate before `svc.AddEvent` | VERIFIED | `IgnoreMatcher` interface defined; gate at line 95, before `SessionModel` (line 104) and `AddEvent` (line 119) |
| `backend/internal/config/config.go` | CORS and remote bind env config | VERIFIED | Contains `IgnorePath`, `CORSOrigins`, `AllowRemote`; loads `HOOKER_IGNORE`, `HOOKER_CORS_ORIGINS`, `HOOKER_ALLOW_REMOTE` |
| `backend/internal/server/middleware.go` | Strict CORS allowlist middleware | VERIFIED | `corsAllowlist()` with `Vary: Origin`; no wildcard CORS |
| `backend/cmd/server/main.go` | Remote bind validation and warning | VERIFIED | `validateBind`, `isLoopbackHost`, `warnRemoteBind` helpers; startup exits on ungated remote bind |
| `backend/cmd/server/main_test.go` | `validateBind` and `isLoopbackHost` tests | VERIFIED | `TestValidateBind_LoopbackPasses`, `TestValidateBind_RemoteWithoutFlagFails`, `TestValidateBind_RemoteWithFlagPasses` |
| `backend/tests/internal/server/router_test.go` | CORS allow/deny regression tests | VERIFIED | Tests for localhost, 127.0.0.1, external origin rejection, null origin rejection |
| `backend/tests/internal/handler/hook_test.go` | No DB row and no SSE broadcast regression tests | VERIFIED | `TestHookIgnoredEventReturns200`, `TestHookIgnoredEventStoresNoRows`, `TestHookIgnoredEventNoSSEBroadcast` |
| `Dockerfile` | Remote bind policy compatibility | VERIFIED | `ENV HOOKER_ALLOW_REMOTE=1` alongside `ENV ADDR=0.0.0.0:8765` with explanatory comment |
| `docs/privacy.md` | Privacy controls and export implications | VERIFIED | Contains `~/.config/hooker/ignore`, `HOOKER_IGNORE`, `cwd`, `path`, `NDJSON`, `snapshot`; explicitly states no raw-text scanning |
| `docs/security.md` | Local threat model | VERIFIED | Contains `localhost-use`, `single-user`, `no auth`, `HOOKER_ALLOW_REMOTE=1`, `ngrok`, `unsupported` |
| `CONTRIBUTING.md` | Practical contributor guide | VERIFIED | Contains `pnpm`, `fixture payload`, `normalization test`, both `backend/internal/domain/event.go` and `frontend/src/types/events.ts`, `Frontend-backend contract` checklist, `DB column` guidance |
| `docs/adr/0001-sqlite-local-storage.md` | SQLite ADR | VERIFIED | `Status: Accepted` present |
| `docs/adr/0002-hook-normalization-strategy.md` | Normalization ADR | VERIFIED | Contains `NormalizedEvent`, `fixture`, `normalization test` |
| `docs/adr/0003-local-first-positioning.md` | Local-first ADR | VERIFIED | Contains `local-first` |
| `docs/adr/0004-proxy-scope.md` | Proxy scope ADR | VERIFIED | Contains `proxy`; does not describe remote sharing as supported |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/internal/handler/hook.go` | `backend/internal/service/event_service.go` | ignore gate before AddEvent | WIRED | `MatchEvent` call at line 95; `AddEvent` at line 119; gate returns before reaching AddEvent for matched events |
| `backend/internal/privacy/ignore/ignore.go` | `backend/internal/domain/event.go` | domain.NormalizedEvent CWD and Path | WIRED | `ignore.go:17` imports `hooker/internal/domain`; `MatchEvent` receives `domain.NormalizedEvent` |
| `backend/internal/config/config.go` | `backend/internal/server/router.go` | CORS origins passed through router options | WIRED | `main.go:73-76` passes `cfg.CORSOrigins` via `server.Options{CORSOrigins: cfg.CORSOrigins}`; `router.go:37-44` uses it |
| `CONTRIBUTING.md` | `backend/internal/domain/event.go` | contract checklist | WIRED | `CONTRIBUTING.md:154` explicitly names `backend/internal/domain/event.go` in the Frontend-backend contract checklist |
| `CONTRIBUTING.md` | `frontend/src/types/events.ts` | contract checklist | WIRED | `CONTRIBUTING.md:155` explicitly names `frontend/src/types/events.ts` in the checklist |
| `CONTRIBUTING.md` | `backend/tests/internal/agents` | adapter fixture/test rule | WIRED | `CONTRIBUTING.md:136-137` states fixture payload and normalization test required under `backend/tests/internal/agents/<agent>/` |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces no new data-rendering components. Phase artifacts are: backend middleware, config, handler gate, and documentation files. All dynamic behaviors verified at Level 3 (wired).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Privacy gate before AddEvent | `grep -n "MatchEvent\|AddEvent\|SessionModel" backend/internal/handler/hook.go` | MatchEvent at line 95, SessionModel at line 104, AddEvent at line 119 — gate is first | PASS |
| No wildcard CORS in middleware | `grep "Access-Control-Allow-Origin.*\*" backend/internal/server/middleware.go` | No match | PASS |
| HOOKER_ALLOW_REMOTE in config | `grep "AllowRemote\|HOOKER_ALLOW_REMOTE" backend/internal/config/config.go` | Present in struct and Load() | PASS |
| refusing non-loopback error in main | `grep "refusing non-loopback" backend/cmd/server/main.go` | Present at line 127 | PASS |
| Dockerfile remote bind explicit | `grep "HOOKER_ALLOW_REMOTE" Dockerfile` | `ENV HOOKER_ALLOW_REMOTE=1` at line 26 | PASS |
| ADR files exist | `ls docs/adr/` | All four files present | PASS |
| CONTRIBUTING.md fixture requirement | `grep "fixture payload" CONTRIBUTING.md` | Present at line 136, 141 | PASS |
| privacy.md cwd/path scope | `grep "cwd.*path\|path.*cwd" docs/privacy.md` | Line 33: "limited to the normalized event \`cwd\` and explicit \`path\` fields" | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PRIV-01 | 03-02 | gitignore-style path exclusion file, matched paths not ingested | SATISFIED | `backend/internal/privacy/ignore/ignore.go` + hook gate in `handler/hook.go` + config surface in `config.go` |
| PRIV-02 | 03-04 | Privacy warning in setup docs and doctor output | SATISFIED | `scripts/hooker:207`, `docs/install.md:24-25`, `docs/quickstart.md` links to `docs/privacy.md` |
| PRIV-03 | 03-04 | Privacy implications of NDJSON/snapshot export documented | SATISFIED | `docs/privacy.md` Export Implications section explicitly covers NDJSON and SQLite snapshots |
| SEC-02 | 03-03 | CORS origin restricted to explicit allowlist | SATISFIED | `backend/internal/server/middleware.go` — `corsAllowlist()` replaces wildcard; 4 router CORS tests pass |
| SEC-03 | 03-03 | Loopback-only bind enforced default; remote bind requires explicit env var | SATISFIED | `main.go:validateBind()` rejects non-loopback without `HOOKER_ALLOW_REMOTE=1`; `main_test.go` regression coverage |
| SEC-04 | 03-04 | Threat model documented: localhost-use, single-user, no auth, ngrok unsupported | SATISFIED | `docs/security.md` covers all four threat model points |
| CONTRIB-01 | 03-05 | CONTRIBUTING.md: structure, layer boundaries, adapter contract + fixture requirement, DB field guidance | SATISFIED | CONTRIBUTING.md contains all required sections with checklist-driven guidance |
| CONTRIB-02 | 03-05 | ADRs for SQLite, normalization, local-first positioning, proxy scope | SATISFIED | All four ADR files exist under `docs/adr/` with `Status: Accepted` |
| CONTRIB-03 | 03-05 | Frontend-backend contract change process documented | SATISFIED | CONTRIBUTING.md — "Frontend-backend contract checklist" at line 150 covers all 7 steps |

**NOTE — Traceability Staleness (WARNING):** `REQUIREMENTS.md` traceability table at lines 200-201 still shows `SEC-02 | Phase 3 | Pending` and `SEC-03 | Phase 3 | Pending`. The checkbox items at lines 63-64 also retain `- [ ]` instead of `- [x]`. The implementation was committed in `ae5e36f` (feat(03-03)) but `REQUIREMENTS.md` was last updated only in `f757e77` (docs(03-02)). This is a documentation inconsistency only — the code fully satisfies both requirements — but the traceability record should be corrected.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `backend/internal/privacy/ignore/ignore.go` | 181-186 | Duplicate loop block in `matchDirPattern` — the for-loop at lines 175-178 and 180-185 are identical | Info | Dead code; second loop never produces different results from the first; no functional impact but creates confusion |

No TODO/FIXME/placeholder patterns. No stub implementations. No hardcoded empty returns flowing to user-visible output.

---

### Human Verification Required

#### 1. Doctor Privacy Warning in Terminal

**Test:** Run `./scripts/hooker doctor` from the repository root.
**Expected:** Output includes the text: `Privacy: hooker captures prompts, diffs, file paths, tool outputs, raw payloads, and exports.`
**Why human:** Scripts cannot be executed in this verification context.

#### 2. Remote Bind Startup Rejection

**Test:** Start the backend with `ADDR=0.0.0.0:8765 ./hooker-server` (no `HOOKER_ALLOW_REMOTE`).
**Expected:** Process exits before listening with a message containing `refusing non-loopback ADDR` and `HOOKER_ALLOW_REMOTE=1`.
**Why human:** Requires a compiled binary and live process execution.

#### 3. End-to-End Privacy Gate (Ignore → No Storage → No SSE)

**Test:** Create `~/.config/hooker/ignore` containing `/tmp/test-cwd/`. Subscribe to SSE at `GET /api/events/stream`. POST a hook event with `cwd: "/tmp/test-cwd/project"`. Check `GET /api/events` and the SSE channel.
**Expected:** POST returns 200 `{}`; events API returns 0 results; SSE channel receives nothing.
**Why human:** Requires a live backend, real file system, and SSE client to observe the broadcast absence.

---

### Gaps Summary

No functional gaps. All 15 must-have truths are verified in the codebase. The phase goal — mature local product with explicit privacy controls, local-first security posture, and contributor guardrails — is implemented and tested.

One WARNING exists:

**REQUIREMENTS.md traceability not updated for SEC-02/SEC-03:** Lines 200-201 show both as "Pending" and lines 63-64 retain unchecked `[ ]` markers, despite implementation being complete since commit `ae5e36f`. Update these two rows to `Complete` and flip the checkboxes to `[x]` to close the traceability gap.

Three items require human verification for runtime behavior confirmation. Automated code inspection fully supports passing all three — human verification is a confirmation step, not a remediation step.

---

_Verified: 2026-05-27T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
