# Phase 10: Diagnostics Backend Performance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 10-Diagnostics Backend Performance
**Areas discussed:** Fix scope, Index migration, Test depth

---

## Fix Scope

**Q1: How much to change beyond fixing the 2 correlated subqueries?**

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — fix 2 subqueries only | Rewrite lastSeenRows and versionRows to use MAX()+GROUP BY. Keep 4 separate queries. | ✓ |
| Merge queries 3+4 | Fix + consolidate eventRows+versionRows into 1 query. Halves hook_events scans. | |
| Full consolidation | Collapse all 4 queries into 1-2 using JOINs. Maximum efficiency. | |

**User's choice:** Minimal — fix 2 subqueries only

---

**Q2: lastSeenRows — how to handle datetime ordering in MAX-based replacement?**

| Option | Description | Selected |
|--------|-------------|----------|
| MAX(last_seen_at) direct | Simple string MAX — already used at line 274. Safe for ISO 8601. | ✓ |
| MAX(datetime(last_seen_at)) + subquery | Defensive datetime() wrapping, rejoin original string. More complex. | |

**User's choice:** MAX(last_seen_at) direct

---

**Q3: versionRows — extract shared agent inference CTE?**

| Option | Description | Selected |
|--------|-------------|----------|
| No — keep queries fully independent | Each query self-contained. More code but easier to read/modify. | ✓ |
| Yes — extract shared CTE | Named CTE in Go const, referenced by both queries. Less duplication. | |

**User's choice:** No — keep queries fully independent

---

## Index Migration

**Q1: Add migration 009 with index for versionRows query?**

| Option | Description | Selected |
|--------|-------------|----------|
| Skip — existing indexes are enough | idx_hook_events_agent + idx_hook_events_created sufficient. No new migration. | ✓ |
| Add hook_events(normalizer_version, created_at) index | Partial index where normalizer_version IS NOT NULL. Extra maintenance. | |

**User's choice:** Skip — existing indexes are enough

---

## Test Depth

**Q1: What level of test verification?**

| Option | Description | Selected |
|--------|-------------|----------|
| Existing tests only | go test ./... must pass — diagnostics data contract tests verify correctness. | ✓ |
| Add correctness test with many rows | New test seeding 100+ hook_events rows verifying correct aggregates. | |
| Add benchmark | Go benchmark seeding large dataset, measures ns/op. | |

**User's choice:** Existing tests only

---

## Claude's Discretion

- Exact CTE variable naming in the rewritten versionRows query (e.g., `latest`, `max_ts`)
- Whether to keep pointer scan pattern or collapse to single SELECT — follow existing code style

## Deferred Ideas

None — discussion stayed within phase scope.
