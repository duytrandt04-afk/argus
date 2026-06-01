---
phase: 08
slug: session-file-changes-view
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-01T04:48:38Z
updated: 2026-06-01T04:48:38Z
register_authored_at_plan_time: true
---

# Phase 08 - Security

Per-phase security contract: threat register, accepted risks, and audit trail for the session file-changes view.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser route to local API | Session detail route requests metadata and file-change groups from hooker API | Encoded cwd, session id |
| SQLite event store to API response | Stored hook events are grouped into file-change records | Local file paths, tool names, timestamps, old/new snippets |
| Captured agent content to React UI | Paths and snippets captured from local tool use render in the browser | Arbitrary local text, code snippets, command-derived patch snippets |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-08-01 | Tampering / XSS | `FileChangesList` snippet and path rendering | mitigate | Snippets and paths render as React text nodes; no `dangerouslySetInnerHTML` or direct HTML insertion in the session file-change components. | closed |
| T-08-02 | Information Disclosure | Codex `apply_patch` file-change API | mitigate | `FileChangeEvent` exposes path, tool/action metadata, old/new snippets, and start line only; stored raw patch `command` is parsed server-side and not serialized in `/api/file-changes`. | closed |
| T-08-03 | Tampering | Tool/path-driven styling | mitigate | Tool badge and icon classes come from static `toolTone` switch mappings; captured tool/path values are not concatenated into arbitrary class names. | closed |
| T-08-04 | Denial of Service | Large captured snippets in expanded rows | mitigate | Snippet blocks use `max-h-64 overflow-auto whitespace-pre-wrap break-words`, keeping large captured values scroll-bounded inside the row layout. | closed |
| T-08-05 | Spoofing / Tampering | Encoded cwd and session route handling | mitigate | Session detail route decodes cwd defensively, encodes cwd when fetching sessions, and `useFileChanges` encodes session ids before API requests. | closed |
| T-08-06 | Tampering | Verification fixtures | mitigate | Backend file-change tests use in-memory SQLite/test services and realistic hook payloads; frontend tests stub `fetch` and do not touch the developer's real DB or network. | closed |

---

## Evidence

- `frontend/src/features/sessions/FileChangesList.tsx` renders `group.path`, `old_string`, and `new_string` as JSX text, uses static badge/icon class mappings, and bounds snippet panels with `max-h-64 overflow-auto`.
- `frontend/src/features/sessions/TraceViewPage.tsx` uses defensive `safeDecodeURIComponent` and `encodeURIComponent(cwd)` for session metadata fetches.
- `frontend/src/features/sessions/hooks/useFileChanges.ts` encodes `session_id` in `/api/file-changes` requests.
- `backend/internal/domain/event.go` defines `FileChangeEvent` without `command` or `raw_payload` fields.
- `backend/internal/repository/sqlite/sqlite.go` reads stored `command` only to derive missing Codex patch snippets and serializes only old/new snippet fields.
- `backend/tests/internal/handler/file_changes_contract_test.go` covers Codex `apply_patch` hook-to-file-changes behavior.
- `backend/tests/internal/repository/sqlite/file_changes_legacy_test.go` covers historical command-only Codex `apply_patch` rows and session file-change counts.
- Focused frontend tests cover loading, empty, error, pagination, expanded snippet rendering, encoded session-id fetches, and stale-data clearing.

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-01 | 6 | 6 | 0 | codex |

---

## Verification Results

- `cd backend && GOCACHE=/private/tmp/hooker-gocache go test ./tests/internal/agents/codex ./tests/internal/handler ./tests/internal/repository/sqlite` - passed
- `pnpm --dir frontend test --run tests/features/sessions/project-session-traces.test.tsx tests/features/sessions/useFileChanges.test.ts` - passed: 2 files, 17 tests
- `rg -n "dangerouslySetInnerHTML|innerHTML" frontend/src/features/sessions frontend/src/features/events/renderers backend/internal/repository/sqlite/sqlite.go backend/internal/domain/event.go` - no matches

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-01
