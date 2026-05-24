---
phase: worker-queue-auth
reviewed: 2026-05-20T06:42:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - backend/cmd/server/main.go
  - backend/cmd/worker/main.go
  - backend/internal/agents/claudecode/worker.go
  - backend/internal/auth/anthropic_client.go
  - backend/internal/auth/oauth.go
  - backend/internal/handler/summary.go
  - backend/internal/queue/queue.go
  - backend/internal/repository/sqlite/sqlite.go
  - backend/internal/repository/sqlite/migrations/008_pending_jobs.sql
  - backend/internal/repository/sqlite/migrations/009_observation_dedup.sql
  - backend/internal/server/router.go
  - backend/internal/service/event_service.go
  - backend/internal/worker/worker.go
  - backend/tests/internal/agents/claudecode/worker_test.go
  - backend/tests/internal/auth/anthropic_client_test.go
  - backend/tests/internal/auth/oauth_test.go
  - backend/tests/internal/server/router_test.go
  - backend/tests/internal/worker/integration_test.go
  - backend/tests/internal/worker/worker_test.go
  - frontend/src/features/events/AgentSession.tsx
  - frontend/src/features/events/EventFilters.tsx
  - frontend/src/features/events/EventRow.tsx
  - frontend/src/features/events/EventsPage.tsx
  - frontend/src/features/events/SessionList.tsx
  - frontend/src/features/events/hooks/useEventFilters.ts
  - frontend/tests/features/events/EventFilters.test.tsx
  - hooks/session-start.sh
findings:
  critical: 4
  warning: 7
  info: 3
  total: 14
status: issues_found
---

# Code Review Report: Worker / Queue / Auth / Frontend

**Reviewed:** 2026-05-20T06:42:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

This change introduces an async job queue backed by SQLite, a worker daemon for Anthropic API calls (summaries + observations), a multi-platform OAuth keychain reader, an HTTP summary endpoint, and a suite of frontend split-view / drag-and-drop features. The architecture is well-structured and the core queue design (dedup index, `BEGIN IMMEDIATE`, WAL mode) is sound. However, four correctness and security issues need to be addressed before shipping: a Windows PowerShell injection via username, a permanently-failing job loop with no retry cap, a miscategorised variable name that masks case-sensitive matching failures, and the `sendViaCLI` path silently discarding multi-turn message history.

---

## Critical Issues

### CR-01: Windows PowerShell injection via username in `readWindowsCredentialManager`

**File:** `backend/internal/auth/oauth.go:170-200`

**Issue:** `safeUser` is constructed with `strings.ReplaceAll(currentUsername(), "'", "''")` — escaping single quotes for PowerShell string literals — but the username is interpolated into the `$candidates` array literal on line 173 inside a double-quoted string format. A username containing `"`, `` ` ``, `$`, or `)` characters is not escaped and will break out of the string context. On Windows, usernames can legally contain these characters (e.g. a username `foo"$(calc.exe)#` or backtick-injection). Because this runs `powershell.exe -Command <script>`, the injected username is executed as PowerShell code.

**Fix:** Pass the username as an environment variable to `powershell.exe` and reference it via `$Env:TARGET_USER` inside the script, eliminating all string-escaping concerns entirely:

```go
cmd := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-Command", psScript)
cmd.Env = append(os.Environ(), "HOOKER_PS_USER="+currentUsername())
// Inside psScript, replace the interpolated username with:
// $candidates = @('Claude Code-credentials', 'Claude Code:credentials',
//                  "Claude Code-credentials:$($Env:HOOKER_PS_USER)")
```

---

### CR-02: Failed jobs reset to `pending` with no retry cap — permanent tight loop

**File:** `backend/internal/queue/queue.go:132-139` and `backend/internal/worker/worker.go:72-83`

**Issue:** `Fail()` unconditionally resets `status = 'pending'`, causing the worker to pick up and re-fail the same job on every subsequent poll cycle. Only `rate_limit` errors have backoff; `auth_invalid`, `unrecoverable`, and `transient` errors return to the front of the queue immediately. A single job that always fails (e.g. a malformed payload that consistently returns a 400 `unrecoverable` error, or an expired OAuth token returning `auth_invalid`) will drive a tight loop: `ClaimNext` → `process` → `Fail` → `ClaimNext` every 3 seconds forever, spamming logs and preventing other jobs from making forward progress because the dedup index blocks new enqueues for the same (dedup_key, job_type) while the job is `pending`/`processing`.

**Fix:** Add an `attempts` column and cap retries, or at minimum do not reset `unrecoverable` and `auth_invalid` errors back to `pending`:

```go
// queue.go - add FailPermanently for unrecoverable errors
func (s *Store) FailPermanently(id int64, reason string) error {
    _, err := s.db.Exec(
        `UPDATE pending_jobs SET status = 'failed', error = ?, claimed_at = NULL WHERE id = ?`,
        reason, id,
    )
    return err
}

// worker.go - in Run(), after process() returns error:
var ae *auth.AnthropicError
if errors.As(err, &ae) {
    switch ae.Kind {
    case "rate_limit":
        _ = w.jobs.Fail(job.ID, err.Error())
        sleep(ctx, max(ae.RetryAfter, 60*time.Second))
    case "unrecoverable", "auth_invalid":
        _ = w.jobs.FailPermanently(job.ID, err.Error())
    default: // transient
        _ = w.jobs.Fail(job.ID, err.Error())
    }
} else {
    _ = w.jobs.Fail(job.ID, err.Error())
}
```

---

### CR-03: `sendViaCLI` silently discards all but the last message, producing wrong results

**File:** `backend/internal/auth/anthropic_client.go:262-320`

**Issue:** When `AuthModeAutoOAuth` is active and the `claude` binary is in `PATH`, `Send()` dispatches to `sendViaCLI`, which extracts only `messages[len(messages)-1].Content` and passes it as a bare `-p` prompt. Any multi-turn conversation context (system prompts, prior turns, tool results) is dropped silently. Currently the worker only ever sends single-message requests, so this is latent — but `AnthropicClient.Send` is a public API that accepts `[]Message` with an explicit contract of passing the full conversation. A caller adding a system prompt or multi-turn exchange would see incorrect, context-free responses with no error returned.

This is also a test-validity bug: `TestAnthropicClient_AutoOAuth_NoToken` mocks the HTTP transport, but on machines where `claude` is installed (including the developer's own machine, confirmed at `/opt/homebrew/bin/claude`), the test bypasses the mock entirely and exercises `sendViaCLI` instead. The test result depends on whether a valid OAuth token is present — its outcome is non-deterministic across environments.

**Fix:** Either document and enforce that `sendViaCLI` is only called for single-message requests (and panic/error otherwise), or pass the full prompt context by reconstructing a conversation string for the CLI. For the test, gate `sendViaCLI` behind an injectable function or flag so tests can disable the CLI path:

```go
// Disable CLI path in tests by setting an unexported flag or using a test-only config field
type ClientConfig struct {
    // ...existing fields...
    DisableCLIFallback bool // for testing
}

// In Send():
if c.cfg.Mode == AuthModeAutoOAuth && !c.cfg.DisableCLIFallback {
    if cliPath, err := exec.LookPath("claude"); err == nil {
        return c.sendViaCLI(ctx, messages, cliPath)
    }
}
```

---

### CR-04: `classifyHTTPError` variable named `lower` is not actually lowercased — case-sensitive matching silently misclassifies errors

**File:** `backend/internal/auth/anthropic_client.go:220-239`

**Issue:** The variable is declared as `lower := body` (line 220), not `lower := strings.ToLower(body)`. The naming strongly implies case-insensitive matching, but the `contains()` function performs a byte-level case-sensitive substring search. The Anthropic API error bodies use mixed case (e.g. `"Invalid API Key"`, `"Overloaded"`, `"Quota Exceeded"`). When the response body does not exactly match the lowercase literals:

- `"Overloaded"` → misses `contains(lower, "overloaded")`, falls through to the 5xx branch (`transient`) only because `529` status is also checked — fragile
- `"Invalid API Key"` → misses `contains(lower, "invalid api key")`, falls through to `default: unrecoverable`
- `"Quota Exceeded"` → misses `contains(lower, "quota exceeded")`, falls through to `default: unrecoverable` causing the job to be permanently failed instead of triggering quota handling

**Fix:**

```go
lower := strings.ToLower(body)  // line 220 — change body to strings.ToLower(body)
```

---

## Warnings

### WR-01: PID-file daemon detection has a TOCTOU race condition

**File:** `backend/cmd/worker/main.go:63-83` and `backend/cmd/server/main.go:78-93`

**Issue:** Both `isRunning()` (worker) and `standaloneWorkerRunning()` (server) perform a read-then-check: read PID file → `os.FindProcess` → `Signal(0)`. Two processes starting simultaneously (e.g. two Claude Code sessions firing the `SessionStart` hook in quick succession) can both read no PID file, both proceed past `isRunning`, and both write their PIDs — resulting in two worker daemons running against the same DB. The workers will then both poll and race for the same jobs. Under WAL mode with `MaxOpenConns(1)` this will cause lock contention but not data corruption; however the dedup guarantees break (one job may be processed twice before dedup prevents a third).

**Fix:** Use `O_CREATE|O_EXCL` to atomically create the PID file, which is the standard lock-file pattern:

```go
f, err := os.OpenFile(pidFile, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
if err != nil {
    if os.IsExist(err) {
        return fmt.Errorf("pid file already exists")
    }
    return err
}
defer f.Close()
_, err = fmt.Fprintf(f, "%d\n", os.Getpid())
return err
```

---

### WR-02: `ClaimNext` does not issue `ROLLBACK` on `COMMIT` failure — leaves transaction in inconsistent state until connection close

**File:** `backend/internal/queue/queue.go:115-117`

**Issue:** If `COMMIT` fails (line 115), the function returns an error without issuing a `ROLLBACK`. The UPDATE that set `status='processing'` is part of the open transaction and will be rolled back when `conn.Close()` executes via `defer`, but: (a) the job remains in `processing` state until that happens — the dedup index prevents new enqueues for the same key during that window, and (b) this is an implicit reliance on `defer conn.Close()` for transaction cleanup, which is fragile and non-obvious. If the connection is ever reused (e.g. connection pooling changes), the implicit rollback may not fire.

**Fix:**

```go
if _, err = conn.ExecContext(ctx, "COMMIT"); err != nil {
    _, _ = conn.ExecContext(ctx, "ROLLBACK")
    return nil, fmt.Errorf("queue claim commit: %w", err)
}
```

---

### WR-03: Infinite retry with no backoff for `transient` errors (worker)

**File:** `backend/internal/worker/worker.go:72-83`

**Issue:** The rate-limit backoff path (lines 76-83) only triggers for `ae.Kind == "rate_limit"`. Transient errors (`overloaded`, 5xx) call `Fail()` which resets to `pending`, and the next poll fires after 3 seconds (`pollInterval`). Under sustained API overload, the worker hammers the API every 3 seconds for every job, amplifying the load. Coupled with CR-02, `auth_invalid` and `unrecoverable` also hit this same tight cycle.

**Fix:** Add exponential backoff for transient errors, e.g. `sleep(ctx, 30*time.Second)` after a transient failure before returning from the poll iteration.

---

### WR-04: `session-start.sh` comment claims "double-fork" but performs a single fork

**File:** `hooks/session-start.sh:15-17`

**Issue:** The comment on line 15 says "double-fork so it detaches from this shell and survives the hook process exiting." The actual spawn is `nohup "$WORKER_BIN" >> "$LOG_FILE" 2>&1 &` — a single `fork+exec` with `nohup` (which ignores SIGHUP). This is not a double-fork. On Linux, the spawned process remains a child of the shell process. When Claude Code's hook runner waits for child processes, it may wait on the worker before proceeding. The misleading comment may also cause future maintainers to rely on double-fork semantics (e.g. expecting `getppid() == 1`) when those semantics are not present.

**Fix:** Either correct the comment, or actually double-fork if process group detachment is required:

```bash
# True double-fork:
(DB_PATH="$DB_PATH" nohup "$WORKER_BIN" >> "$LOG_FILE" 2>&1 &)
```

---

### WR-05: `migrate()` executes `PRAGMA journal_mode=WAL` inside migration 009 via `Exec()` — redundant and potentially unreliable

**File:** `backend/internal/repository/sqlite/migrations/009_observation_dedup.sql:14`

**Issue:** WAL mode is already set in the DSN connection string on line 57 of `sqlite.go` (`_pragma=journal_mode(wal)`), so the PRAGMA in the migration is redundant. More importantly, `migrate()` calls `d.db.Exec(m.sql)` which passes the entire migration as a single string. The behaviour of `PRAGMA journal_mode=WAL` executed within a multi-statement `Exec()` call is implementation-defined in `modernc.org/sqlite`. If the driver processes statements sequentially and the PRAGMA runs while a schema-migration transaction is open, it will silently fail (SQLite ignores journal mode changes inside transactions). This creates a false sense that WAL is being enabled at migration time.

**Fix:** Remove the `PRAGMA journal_mode=WAL;` line from `009_observation_dedup.sql`. WAL is already set by the DSN. If belt-and-suspenders enforcement is desired, run it once explicitly after `sql.Open`, not inside a migration.

---

### WR-06: `useEventFilters` fetches `/api/projects` on every `events.length` change — unnecessary API hammering during live SSE streams

**File:** `frontend/src/features/events/hooks/useEventFilters.ts:92-110`

**Issue:** The `useEffect` that fetches `/api/projects` has `[events.length]` as its dependency (line 110). During a live SSE session, `events` grows with every incoming event, triggering a new HTTP request for the projects list on every new event arrival. The 15-second `setInterval` inside the effect would provide adequate refresh frequency on its own; the `events.length` dependency is unnecessary and causes a request storm.

**Fix:** Remove `events.length` from the dependency array. The interval alone is sufficient:

```ts
useEffect(() => {
  // ...fetchProjects...
  const interval = window.setInterval(fetchProjects, 15_000)
  return () => { mounted = false; window.clearInterval(interval) }
}, []) // remove events.length dependency
```

---

### WR-07: `AgentSession` uses array index `i` as React `key` for event rows, breaking reconciliation after pagination

**File:** `frontend/src/features/events/AgentSession.tsx:148-149`

**Issue:** `visibleEvents.map((e, i) => <EventRow key={i} .../>)` — using the array index as key causes React to reuse DOM nodes in unexpected ways when the paginated slice changes. Navigating between pages replaces event content but reuses DOM nodes keyed by position 0–N, which means refs (including `rowRef` used for scroll-to in `EventRow`) may point to stale elements. The `targetHandledRef.current = true` guard also gets stuck on the wrong DOM node when the page index changes after the key reuse. `buildEventKey(e)` is already imported and used elsewhere in this file.

**Fix:**

```tsx
{visibleEvents.map((e) => (
  <EventRow
    key={buildEventKey(e)}
    event={e}
    // ...
  />
))}
```

---

## Info

### IN-01: `contains()` in `anthropic_client.go` is a hand-rolled reimplementation of `strings.Contains`

**File:** `backend/internal/auth/anthropic_client.go:251-260`

**Issue:** The custom `contains` function is a byte-by-byte substring search identical to `strings.Contains`. It adds 10 lines with no semantic difference and no performance benefit. The only reason to write it would be to avoid an import, but `strings` is already imported.

**Fix:** Replace all calls to `contains(s, sub)` with `strings.Contains(s, sub)` and delete the function.

---

### IN-02: `Fail()` sets `status = 'pending'` but the schema defines a `'failed'` status that is never written

**File:** `backend/internal/queue/queue.go:132-139` and `backend/internal/repository/sqlite/migrations/008_pending_jobs.sql:6`

**Issue:** The schema `CHECK` constraint allows `status IN ('pending', 'processing', 'done', 'failed')` but `Fail()` writes `'pending'`. The `'failed'` terminal state is dead schema — it cannot be queried to find permanently-failed jobs, and any monitoring that checks `WHERE status = 'failed'` will always return zero rows. This is coupled to CR-02 (no retry cap).

**Fix:** Once CR-02 is addressed, `FailPermanently()` should write `status = 'failed'` to make the terminal state observable.

---

### IN-03: `UpsertSummary` and `UpsertObservation` always called with empty model string

**File:** `backend/internal/worker/worker.go:117` and `backend/internal/worker/worker.go:144`

**Issue:** Both `w.db.UpsertSummary(job.SessionID, resp.Content[0].Text, "")` and `w.db.UpsertObservation(...)` pass `""` for the model parameter. The `ai_summaries` and `ai_observations` tables have `model TEXT NOT NULL DEFAULT ''` columns — the stored value will always be empty. If the model used to generate summaries/observations needs to be auditable or displayed in the UI, this field will be perpetually blank. The `AnthropicClient` knows which model was used (stored in `cfg.Model`).

**Fix:** Expose a getter on `AnthropicClient` or return the model name from `Send()`, then pass it through to the upsert calls.

---

_Reviewed: 2026-05-20T06:42:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
