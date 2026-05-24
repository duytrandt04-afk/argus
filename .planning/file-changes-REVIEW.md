---
phase: file-changes
reviewed: 2026-05-17T14:42:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - backend/internal/domain/event.go
  - backend/internal/handler/file_changes.go
  - backend/internal/repository/repository.go
  - backend/internal/repository/sqlite/sqlite.go
  - backend/internal/server/router.go
  - backend/internal/service/event_service.go
  - backend/tests/internal/server/router_test.go
  - backend/tests/internal/service/event_service_test.go
  - frontend/src/features/sessions/FileChangesDrawer.tsx
  - frontend/src/features/sessions/TraceViewPage.tsx
  - frontend/src/features/sessions/hooks/useFileChanges.ts
  - frontend/src/types/sessions.ts
  - frontend/tests/features/sessions/project-session-traces.test.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# File Changes Tracking: Code Review Report

**Reviewed:** 2026-05-17T14:42:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

The file-changes feature adds a `GET /api/file-changes?session_id=` endpoint, two SQLite repository methods (`GetFileChanges`, `GetSessionFileChangeCounts`), a `FileChangesDrawer` React component, and a `useFileChanges` hook. The overall structure is sound: the handler validates the required query parameter, SQL uses parameterized placeholders for all user-supplied values, and the frontend hook correctly cancels in-flight requests on unmount.

Four warnings surfaced: a silently-swallowed error in `ListSessionsByCWDPage` that hides `GetSessionFileChangeCounts` failures from callers; an unstable `sessionStart` derivation in `FileChangesDrawer` that produces incorrect relative-time labels; the `onClose` prop being accepted but never called in `FileChangesDrawer`, leaving the mobile close gesture broken; and an array-index `key` prop on the `ChangeRow` list that will cause stale-render bugs when changes are reordered. Three info-level items round out the review: a duplicate `useFileChanges` call between `TraceViewPage` and `FileChangesDrawer`, missing backend unit tests for both new repository methods, and an absence of any frontend test for `FileChangesDrawer` / `useFileChanges` error and loading paths.

No SQL injection risk exists: the `IN` clause in `GetSessionFileChangeCounts` is built from `len(ids)` repetitions of `?` and all values are passed as driver arguments — this is safe. `GetFileChanges` passes `sessionID` as a positional parameter. The `fileChangeCondition` constant is never interpolated with user data; it is a hardcoded SQL fragment.

---

## Warnings

### WR-01: `GetSessionFileChangeCounts` error silently discarded, caller always returns `nil` error

**File:** `backend/internal/service/event_service.go:384`

**Issue:** `ListSessionsByCWDPage` calls `GetSessionFileChangeCounts` inside an `if err == nil { ... }` guard with no `else` branch. When the database call fails, the error is dropped and the method returns successfully with all `FileChangeCount` values at zero. The caller (the sessions handler) cannot distinguish "counts unavailable because the DB failed" from "session genuinely has no file changes". This also masks any schema migration issues or SQLite errors from reaching the HTTP layer.

```go
// current — error is swallowed
if counts, err := s.repo.GetSessionFileChangeCounts(ids); err == nil {
    for i, sess := range sessions {
        sessions[i].FileChangeCount = counts[sess.SessionID]
    }
}
return sessions, total, nil
```

**Fix:** Propagate the error, consistent with every other repository call in this codebase:

```go
counts, err := s.repo.GetSessionFileChangeCounts(ids)
if err != nil {
    return nil, 0, err
}
for i, sess := range sessions {
    sessions[i].FileChangeCount = counts[sess.SessionID]
}
```

If silent degradation is intentional (i.e. counts are best-effort), add a `log.Printf` so the failure is at least observable, and leave a comment explaining the deliberate choice.

---

### WR-02: `sessionStart` derived from first change time, not session start time

**File:** `frontend/src/features/sessions/FileChangesDrawer.tsx:139`

**Issue:** `sessionStart` is computed as:

```ts
const sessionStart = groups[0]?.changes[0]?.time ?? new Date().toISOString()
```

This uses the timestamp of the **first file-change event** as the session baseline for `formatRelativeTime`. The correct anchor is the session's `started_at` timestamp. As a result, the first change always shows `+0s` and all subsequent changes display durations relative to that first change rather than to the true session start. The visual mismatch grows larger when sessions have an initial period of exploration before any writes occur.

Additionally, the fallback `new Date().toISOString()` — triggered when `groups` is empty — causes the relative-time display to render negative numbers if a component is momentarily rendered with no groups.

**Fix:** Pass `sessionStart` from the caller as a prop rather than deriving it from the data:

```tsx
type FileChangesDrawerProps = {
  sessionId: string
  sessionStart: string   // ISO string from session.started_at
  onClose: () => void
}

export function FileChangesDrawer({ sessionId, sessionStart, onClose }: FileChangesDrawerProps) {
  const { groups, loading, error } = useFileChanges(sessionId)
  // remove local sessionStart derivation
  ...
}
```

In `TraceViewPage`, pass `session?.started_at ?? ''` (the `session` state is already available at both render sites on lines 378 and 397).

---

### WR-03: `onClose` prop accepted but never called — mobile close button broken

**File:** `frontend/src/features/sessions/FileChangesDrawer.tsx:136`

**Issue:** The component signature receives `onClose` and immediately aliases it to `_onClose` (the underscore prefix signals it is intentionally unused):

```tsx
export function FileChangesDrawer({ sessionId, onClose: _onClose }: FileChangesDrawerProps) {
```

In `TraceViewPage` the mobile overlay path renders `FileChangesDrawer` inside an `<aside>` with no other close affordance — the backdrop `<button>` on line 389 calls `closePanel`, but the drawer itself provides no close button of its own. On desktop the resizable panel's collapse gesture handles dismissal. On mobile, pressing outside the drawer closes it, but there is no in-drawer close control. This is inconsistent with `TraceInspectionPanel`, which renders a close button when `onClose` is supplied (line 106 of `TraceInspectionPanel.tsx`).

**Fix:** Remove the underscore alias and wire a close button inside the drawer header, mirroring `TraceInspectionPanel`:

```tsx
export function FileChangesDrawer({ sessionId, onClose }: FileChangesDrawerProps) {
  ...
  // inside the header div:
  <button
    type="button"
    aria-label="Close file changes"
    onClick={onClose}
    className="..."
  >
    <X className="h-4 w-4" />
  </button>
```

---

### WR-04: Array-index `key` prop on `ChangeRow` list

**File:** `frontend/src/features/sessions/FileChangesDrawer.tsx:93`

**Issue:**

```tsx
{group.changes.map((ev, i) => (
  <ChangeRow key={i} ev={ev} sessionStart={sessionStart} />
))}
```

Using the array index as `key` causes React to reuse DOM nodes incorrectly when the `changes` array is reordered or when a change is prepended (e.g. after a re-fetch of the same session). State internal to `ChangeRow` (none currently, but this is fragile) and React reconciliation both rely on stable identity. The `FileChangeEvent` has a unique `time` field; that is a better key.

**Fix:**

```tsx
{group.changes.map((ev) => (
  <ChangeRow key={`${ev.time}-${ev.tool}`} ev={ev} sessionStart={sessionStart} />
))}
```

`ev.time + ev.tool` is stable across re-renders for the same logical change. If the same tool fires twice at the exact same millisecond on the same path (edge case), append `start_line` as a tiebreaker.

---

## Info

### IN-01: Duplicate `useFileChanges` fetch — two hooks for the same session ID

**File:** `frontend/src/features/sessions/TraceViewPage.tsx:50` and `frontend/src/features/sessions/FileChangesDrawer.tsx:137`

**Issue:** `TraceViewPage` calls `useFileChanges(sessionId)` on line 50 to populate the "Files" button badge count. `FileChangesDrawer` — rendered as a child when the panel is in `files` mode — calls `useFileChanges(sessionId)` again independently. This results in two identical HTTP requests to `/api/file-changes?session_id=...` for the same session. While not a correctness bug (both calls return identical data), it is unnecessary network traffic and means the badge count and drawer content can briefly be out of sync while the second request is in-flight.

**Fix:** Lift the `useFileChanges` result down as props into `FileChangesDrawer`, or use a shared cache (React Query / SWR). The simplest fix given the project's no-global-store convention is to pass `groups` and `loading` as props from the parent, removing the internal hook call:

```tsx
type FileChangesDrawerProps = {
  sessionId: string
  sessionStart: string
  groups: FileChangeGroup[]
  loading: boolean
  error: string | null
  onClose: () => void
}
```

---

### IN-02: No backend unit tests for `GetFileChanges` and `GetSessionFileChangeCounts`

**Files:** `backend/internal/repository/sqlite/sqlite.go:903`, `backend/internal/repository/sqlite/sqlite.go:952`

**Issue:** Both new repository methods have zero dedicated tests. The existing test suite only adds stub implementations in mock repos (`GetFileChanges` returning `nil, nil` and `GetSessionFileChangeCounts` returning an empty map). The `fileChangeCondition` logic — which determines which events count as file modifications — is entirely untested. Bugs in the tool-name list or the `old_string`/`new_string` fallback conditions would not be caught.

Per project convention (`CLAUDE.md`): "If adding a new handler or service method, add a corresponding `_test.go` alongside it."

**Fix:** Add a `sqlite_test.go` test (or extend the existing one) using `sqlite.New(":memory:")` that:
1. Inserts events with various `tool_name` values (`write`, `edit`, `str_replace_based_edit_tool`, unknown tools) and asserts only qualifying ones appear in results.
2. Verifies `GetSessionFileChangeCounts` returns correct distinct-path counts per session.
3. Verifies an empty `ids` slice returns an empty map without error.

Also add a handler test for `GET /api/file-changes` that verifies the `session_id` required-parameter check (400 when missing).

---

### IN-03: No frontend tests for `FileChangesDrawer` loading, error, and empty states

**File:** `frontend/src/features/sessions/FileChangesDrawer.tsx`

**Issue:** The existing test file (`project-session-traces.test.tsx`) stubs `/api/file-changes` to return an empty array in integration tests for `TraceViewPage`, but there are no unit tests for `FileChangesDrawer` itself. The loading spinner, error message, empty-state message, and the `FileRow` expand/collapse toggle have no test coverage.

**Fix:** Add a `__tests__/FileChangesDrawer.test.tsx` (co-located per project convention) covering:
- Renders loading state while fetch is pending
- Renders error message on fetch failure
- Renders empty-state text when groups array is empty
- Renders file paths and expands a row on click

---

_Reviewed: 2026-05-17T14:42:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
