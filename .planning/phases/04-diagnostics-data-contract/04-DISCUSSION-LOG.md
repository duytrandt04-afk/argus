# Phase 4: Diagnostics Data Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 4-Diagnostics Data Contract
**Areas discussed:** Diagnostics response shape, Health/readiness semantics, Storage fact privacy and empty states, Aggregate stat definitions

---

## Diagnostics Response Shape

| Decision | Options Considered | Selected |
|----------|--------------------|----------|
| JSON organization | Grouped sections; flat fields; agent decides | Grouped sections |
| Phase 5 placeholders | No placeholders; empty placeholders; agent decides | No placeholders |
| Field naming | camelCase; snake_case; agent decides | camelCase |
| Top-level sections | `version`, `health`, `storage`; add `runtime`; agent decides | `version`, `health`, `storage` |

**User's choice:** Grouped, Phase 4-only response with camelCase fields and top-level `version`, `health`, and `storage`.
**Notes:** The contract should be extendable later without reserving empty Phase 5 sections.

---

## Health/Readiness Semantics

| Decision | Options Considered | Selected |
|----------|--------------------|----------|
| Not-ready HTTP behavior | 200 with `health.ready: false`; 503 like `/readyz`; agent decides | 200 with `health.ready: false` |
| Health fields | Liveness and readiness booleans; readiness only; status string plus booleans | Liveness and readiness booleans |
| Not-ready reason | Generic reason; no reason; detailed reason | Generic reason |
| Embedded status codes | Semantic values only; include status codes; agent decides | Semantic values only |

**User's choice:** Diagnostics remains inspectable with semantic booleans and a generic not-ready reason.
**Notes:** `/readyz` remains the strict readiness endpoint.

---

## Storage Fact Privacy and Empty States

| Decision | Options Considered | Selected |
|----------|--------------------|----------|
| DB path display | Full resolved path; home-relative path; directory only | Full resolved path |
| Unmeasurable DB size | `null` with generic reason; `0`; omit field | `null` with generic reason |
| Empty latest event | `latestEventAt: null`; empty string; omit field | `latestEventAt: null` |
| Captured content samples | No raw content or samples; safe metadata only; agent decides | No raw content or samples |

**User's choice:** Expose operational storage facts while preserving captured-content privacy boundaries.
**Notes:** Size unavailability should not be confused with a zero-byte database.

---

## Aggregate Stat Definitions

| Decision | Options Considered | Selected |
|----------|--------------------|----------|
| `totalSessions` | Count `sessions` rows; count distinct event sessions; expose both | Count `sessions` rows |
| `totalEvents` | Count stored event rows; count only `ok`; expose total and degraded | Count stored event rows |
| `latestEventAt` | Maximum stored event time; most recently inserted row; agent decides | Maximum stored event time |
| Query constraint | Dedicated repository method; reuse dashboard stats; agent decides | Dedicated repository method |

**User's choice:** Use storage-source-of-truth aggregate definitions and dedicated SQL aggregate methods.
**Notes:** Degraded breakdown is intentionally deferred to Phase 5.

## the agent's Discretion

None.

## Deferred Ideas

None.
