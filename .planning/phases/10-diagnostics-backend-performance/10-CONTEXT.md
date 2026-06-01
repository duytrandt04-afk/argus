# Phase 10: Diagnostics Backend Performance - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace two O(n²) correlated subqueries in `DiagnosticsAgentStats()` (`backend/internal/repository/sqlite/sqlite.go:522`) with O(n) MAX()+GROUP BY queries. No schema migrations, no query consolidation, no frontend changes. Purely a SQL rewrite in the repository layer.

</domain>

<decisions>
## Implementation Decisions

### Fix Scope
- **D-01:** Fix only the 2 correlated subqueries — `lastSeenRows` (line 550) and `versionRows` (line 614). Do NOT consolidate queries 3+4 or merge any other queries. Keep all 4 DB round-trips separate and self-contained.
- **D-02:** Keep each query fully independent. The agent inference CTE logic duplicated between `eventRows` and `versionRows` stays duplicated — do not extract a shared Go const or CTE.

### lastSeenRows Fix
- **D-03:** Replace the correlated subquery with `MAX(last_seen_at) GROUP BY agent`. Use direct string MAX — no `datetime()` wrapping needed. `MAX(last_seen_at)` is already used this way at sqlite.go:274 for the same sessions table. ISO 8601 format is consistent.

### versionRows Fix
- **D-04:** Replace the correlated subquery with a two-CTE pattern: `inferred` CTE (existing agent inference logic unchanged) + new `latest` CTE using `MAX(created_at) GROUP BY inferred_agent`. Then JOIN `inferred` to `latest` on `inferred_agent + created_at` to get the `normalizer_version` for the most recent row.

### Index Migration
- **D-05:** No new migration. Existing indexes (`idx_hook_events_agent` on `hook_events(agent)` and `idx_hook_events_created` on `hook_events(created_at DESC)`) are sufficient for the rewritten queries.

### Test Verification
- **D-06:** Existing tests only. Run `go test ./...` — the diagnostics data contract tests verify correct output. No new benchmark or large-dataset test needed.

### Claude's Discretion
- Exact CTE variable naming in the rewritten `versionRows` query (e.g., `latest`, `max_ts`, etc.) — standard Go SQL conventions.
- Whether to collapse `lastSeenRows` query into a single SELECT or keep the pointer scan pattern — follow existing code style in the function.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Target Function
- `backend/internal/repository/sqlite/sqlite.go` lines 522–664 — `DiagnosticsAgentStats()` full function; the two correlated subqueries are at lines 550–562 (`lastSeenRows`) and 614–639 (`versionRows`)

### Domain Contract
- `backend/internal/domain/diagnostics.go` — `DiagnosticsAgentStats` struct; output shape must not change
- `backend/internal/repository/repository.go` — `EventRepository` interface; method signature must not change

### Existing MAX Usage Reference
- `backend/internal/repository/sqlite/sqlite.go` line 274 — `MAX(last_seen_at)` already used on sessions table; confirms string MAX is safe

### Test Contract
- `backend/internal/handler/diagnostics_test.go` (if exists) — handler-level data contract tests that must continue to pass
- `backend/tests/` — repository and service tests that gate the fix

### Schema
- `backend/internal/repository/sqlite/migrations/001_init.sql` — sessions table schema and existing hook_events indexes; no new migration in this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DiagnosticsAgentStats()` at sqlite.go:522 — full function to rewrite; 4 queries, rewrite queries 2 and 4 only
- Existing pattern at sqlite.go:274: `MAX(last_seen_at) AS last_activity` — direct template for the lastSeenRows fix

### Established Patterns
- All queries in `DiagnosticsAgentStats()` follow: `d.db.Query(sql)` → `defer rows.Close()` → scan loop → `rows.Err()` check. New queries must follow the same pattern.
- Agent inference CASE expression (lines 579–590 and 615–626) is the canonical form — do not simplify or change it; only remove the correlated subquery wrapping it.
- Error wrapping uses `fmt.Errorf("diagnostics agent [area]: %w", err)` — follow same naming for any new error sites.

### Integration Points
- `DiagnosticsAgentStats()` is called from `service.EventService` → `handler/diagnostics.go`. No changes needed outside `sqlite.go`.
- The function's output goes directly to the diagnostics JSON response. Struct fields must match exactly.

</code_context>

<specifics>
## Specific Ideas

No specific references — open to standard MAX()+CTE JOIN approach within the constraints above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-Diagnostics Backend Performance*
*Context gathered: 2026-06-01*
