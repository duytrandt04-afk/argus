---
phase: 07-backend-code-quality
reviewed: 2026-05-29T17:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - backend/internal/handler/dashboard.go
  - backend/internal/handler/diagnostics.go
  - backend/internal/handler/events.go
  - backend/internal/handler/file_changes.go
  - backend/internal/handler/helpers.go
  - backend/internal/handler/projects.go
  - backend/internal/handler/sessions.go
  - backend/internal/handler/sessions_tree.go
  - backend/internal/handler/traces.go
  - backend/internal/handler/usage.go
  - backend/internal/handler/version.go
  - backend/tests/internal/handler/dashboard_health_usage_version_test.go
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-05-29T17:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed 11 handler source files and 1 test file covering the HTTP handler layer of the hooker backend. The handlers are generally well-structured and follow the established layered architecture. The JSON encode error logging refactoring from Plan 07-03 is consistently applied across all handlers.

Two critical issues were found: an arbitrary filesystem path traversal in the `Usage` handler that accepts a caller-supplied file path and opens it directly, and internal error detail leakage in the `DashboardStats` handler. Four warnings cover a consistent `Content-Type` header poisoning pattern (set before validation so error responses carry the wrong content type), silent `since` parameter acceptance without format validation, an off-by-one ambiguity in the `hasMore` pagination sentinel, and missing method guard coverage. Three info items cover duplicated pagination response construction, inconsistent nil-slice normalization, and missing test coverage for invalid dashboard date-range inputs.

---

## Critical Issues

### CR-01: Arbitrary Filesystem Read via Unvalidated `path` Query Parameter

**File:** `backend/internal/handler/usage.go:15-35`

**Issue:** The `Usage` handler accepts a `path` query parameter from the HTTP request and passes it directly to `claudecode.ComputeUsage(path)`, `geminicli.ComputeUsage(path)`, and `codex.ComputeUsage(path)`. Each of those functions calls `os.Open(transcriptPath)` on the caller-supplied string with no sanitization. Any unauthenticated client that can reach this endpoint can read any file on the server's filesystem by supplying an arbitrary absolute path (e.g., `?path=/etc/passwd`, `?path=/root/.ssh/id_rsa`). The only validation is a non-empty check; there is no prefix allowlist, no `filepath.Clean` / jail check, and no canonicalization. Although hooker is described as local-first, the CORS middleware still allows cross-origin requests from configured origins, and the `AllowRemote` flag can expose this endpoint to the network.

**Fix:** Validate that the supplied path resolves within an allowed directory (e.g., the user's home directory or a configured transcript root) before passing it to any agent function:

```go
import (
    "path/filepath"
    "strings"
)

func Usage(allowedRoot string) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        raw := r.URL.Query().Get("path")
        if raw == "" {
            http.Error(w, "missing path", http.StatusBadRequest)
            return
        }
        clean := filepath.Clean(raw)
        // Reject paths that escape the allowed root.
        if !strings.HasPrefix(clean, filepath.Clean(allowedRoot)+string(filepath.Separator)) {
            http.Error(w, "path not allowed", http.StatusForbidden)
            return
        }
        // ... rest of handler
    })
}
```

At minimum, reject paths that are not absolute and do not match a known transcript pattern (e.g., must contain `/.claude/` or `/codex/`).

---

### CR-02: Internal Error Detail Leaked to HTTP Response in `DashboardStats`

**File:** `backend/internal/handler/dashboard.go:47-49`

**Issue:** When `svc.GetDashboardStats` returns an error, the handler writes `err.Error()` directly as the HTTP response body. This is the only handler in scope that exposes raw error strings to the caller. All other handlers use opaque strings like `"list events"` or `"get session tree"`. A service or database error may contain internal file paths, SQL query fragments, column names, or other implementation details that should not be disclosed.

```go
// current — leaks internal error detail
http.Error(w, err.Error(), http.StatusInternalServerError)
```

**Fix:** Use an opaque message consistent with the rest of the codebase:

```go
log.Printf("[handler] GetDashboardStats: %v", err)
http.Error(w, "get dashboard stats", http.StatusInternalServerError)
```

---

## Warnings

### WR-01: `Content-Type: application/json` Set Before Validation — Corrupts Error Responses

**File:** `backend/internal/handler/dashboard.go:14`, `backend/internal/handler/file_changes.go:14`, `backend/internal/handler/sessions.go:14`, `backend/internal/handler/traces.go:20`

**Issue:** Four handlers call `w.Header().Set("Content-Type", "application/json")` as the very first line of the handler body, before any input validation. When a subsequent `http.Error(...)` call fires, `http.Error` internally calls `w.Header().Set("Content-Type", "text/plain; charset=utf-8")`, which overwrites the already-sent header — but only because headers have not been written yet. However the ordering is fragile: if `w.Header()` is ever mutated (e.g., middleware flushes headers early, or a future writer wraps the response), the error response will carry `Content-Type: application/json` while delivering a plain-text body. The semantically correct pattern is to set the content type only on the success path, immediately before writing the success body.

`dashboard.go` line 14 is the clearest example: the header is set, then line 24 can still call `http.Error` for an invalid date range, causing the client to receive a `400` with `Content-Type: application/json` and a plain-text body.

**Fix:** Move `w.Header().Set("Content-Type", "application/json")` to after all validation, immediately before `json.NewEncoder(w).Encode(...)`:

```go
// dashboard.go — corrected structure
func DashboardStats(svc *service.EventService) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // ... parse and validate params first ...
        if startErr != nil || endErr != nil || endAt.Before(startAt) {
            http.Error(w, "invalid start/end query params", http.StatusBadRequest)
            return
        }
        stats, err := svc.GetDashboardStats(since, until)
        if err != nil {
            log.Printf("[handler] GetDashboardStats: %v", err)
            http.Error(w, "get dashboard stats", http.StatusInternalServerError)
            return
        }
        w.Header().Set("Content-Type", "application/json") // set here, not at top
        if err := json.NewEncoder(w).Encode(stats); err != nil {
            log.Printf("[handler] encode %T: %v", stats, err)
        }
    })
}
```

---

### WR-02: `since` Query Parameter Accepted Without Format Validation in `Sessions` and `Traces`

**File:** `backend/internal/handler/sessions.go:17`, `backend/internal/handler/traces.go:16`

**Issue:** Both handlers read a `since` query string and pass it verbatim to the service, which passes it verbatim to the repository SQL layer. The SQLite queries use `since` in `WHERE time >= ?` comparisons. If a caller sends a malformed value (e.g., `since=yesterday`, `since='; DROP TABLE events; --`), the SQL comparison will silently produce wrong results (SQLite string comparison against a non-RFC3339 value always evaluates to false, so all rows are returned or excluded unpredictably). While parameterized queries prevent injection, the silent wrong-results behavior is a correctness bug.

By contrast, `dashboard.go` correctly parses and validates both `start` and `end` with `time.Parse(time.RFC3339, ...)` before using them.

**Fix:** Validate the `since` parameter using `time.Parse` before passing it downstream, consistent with `dashboard.go`:

```go
if since != "" {
    if _, err := time.Parse(time.RFC3339, since); err != nil {
        http.Error(w, "invalid since: must be RFC3339", http.StatusBadRequest)
        return
    }
}
```

---

### WR-03: `hasMore` Pagination Sentinel Is Incorrect When Results Are an Exact Multiple of Page Size

**File:** `backend/internal/handler/sessions.go:32`, `backend/internal/handler/traces.go:33`

**Issue:** Both paginated handlers compute:

```go
hasMore := (page * size) < total
```

When `total` is exactly divisible by `size` (e.g., 20 results, page=1, size=20), this evaluates to `20 < 20` = `false`, which is correct. However the formula conflates "items fetched so far" with `page * size`, which is the number of items that *would* have been fetched if all pages were full. If the current page returned fewer than `size` items (a partial last page), `page * size` still exceeds the actual number of items fetched, so `hasMore` will be `true` even though there are no more items. The correct sentinel is `(page-1)*size + len(results) < total`:

```go
hasMore := (page-1)*size+len(sessions) < total
```

This uses the actual returned count rather than the theoretical maximum. Under the current code, the frontend will attempt to fetch a page that returns zero items, causing an extra round-trip on every last page that is not exactly full.

---

### WR-04: No HTTP Method Guard on Read-Only Handlers

**File:** `backend/internal/handler/events.go`, `backend/internal/handler/sessions.go`, `backend/internal/handler/traces.go`, `backend/internal/handler/usage.go` (and others)

**Issue:** Only `hook.go` guards against wrong HTTP methods (`r.Method != http.MethodPost`). All other handlers silently accept any method — `POST`, `PUT`, `DELETE` — and process the request identically to a `GET`. A `POST /api/usage?path=/etc/passwd` works identically to a `GET`. While the project's router may restrict methods externally, the handler itself provides no defense-in-depth. If a route is ever misconfigured or the router is changed, methods will not be rejected at the handler boundary.

**Fix:** Add method guards to all read-only handlers, or extract a shared guard helper:

```go
func methodGuard(allowed string, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.Method != allowed {
            http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

---

## Info

### IN-01: Paginated Response Construction Duplicated in `Sessions` and `Traces`

**File:** `backend/internal/handler/sessions.go:32-42`, `backend/internal/handler/traces.go:32-44`

**Issue:** The paginated response map (`"total"`, `"page"`, `"size"`, `"has_more"`) is constructed with identical structure in both handlers. `parsePageSize` was already extracted into `helpers.go` to reduce this duplication. The response envelope is the next natural candidate for extraction.

**Fix:** Extract a helper in `helpers.go`:

```go
func paginatedResponse(data any, key string, page, size, total int) map[string]any {
    return map[string]any{
        key:      data,
        "total":  total,
        "page":   page,
        "size":   size,
        "has_more": (page-1)*size+countOf(data) < total,
    }
}
```

---

### IN-02: Inconsistent Nil-Slice Normalization Between Handlers

**File:** `backend/internal/handler/sessions.go:29-31` vs `backend/internal/handler/sessions.go:60-62`

**Issue:** The paginated branch (lines 29-31) uses `sessions = []domain.Session{}` to normalize nil slices, while the non-paginated fallback (lines 60-62) uses `sessions = make([]domain.Session, 0)`. Both produce the same JSON (`[]`) but the inconsistency within the same file is a maintenance smell. `projects.go` uses the literal form `[]domain.Project{}`. The convention is inconsistent across handlers.

**Fix:** Standardize on the literal composite form `[]domain.Session{}` throughout, matching the pattern used by `projects.go` and `file_changes.go`.

---

### IN-03: `TestDashboardStatsReturns200` Does Not Cover Invalid Date-Range Inputs

**File:** `backend/tests/internal/handler/dashboard_health_usage_version_test.go:12-26`

**Issue:** `DashboardStats` has explicit validation logic for `start`/`end` query parameters (bad RFC3339 format, end before start) that returns a `400`. The test file has no test case exercising this code path. The happy path (no params) is the only case covered. This means the validation at `dashboard.go:21-25` is untested and could regress silently.

**Fix:** Add test cases:

```go
func TestDashboardStatsReturnsBadRequestForInvalidDateRange(t *testing.T) {
    svc := newTestService(t)
    h := handler.DashboardStats(svc)

    cases := []struct {
        name  string
        query string
    }{
        {"bad start format", "start=not-a-date&end=2026-01-01T00:00:00Z"},
        {"end before start", "start=2026-01-02T00:00:00Z&end=2026-01-01T00:00:00Z"},
    }
    for _, tc := range cases {
        req := httptest.NewRequest(http.MethodGet, "/api/dashboard/stats?"+tc.query, nil)
        rec := httptest.NewRecorder()
        h.ServeHTTP(rec, req)
        if rec.Code != http.StatusBadRequest {
            t.Errorf("[%s] status = %d, want 400", tc.name, rec.Code)
        }
    }
}
```

---

_Reviewed: 2026-05-29T17:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
