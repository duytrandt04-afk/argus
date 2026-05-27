# Phase 4: Diagnostics Data Contract - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 adds a read-only backend diagnostics data contract at `GET /api/diagnostics`. It reports version metadata, health/readiness state, SQLite storage facts, and aggregate event/session stats without expensive full-table scans and without exposing captured content. Hook connectivity diagnostics, privacy/security posture details, and frontend UI are out of scope for this phase and belong to Phases 5 and 6.

</domain>

<decisions>
## Implementation Decisions

### Diagnostics Response Shape
- **D-01:** `GET /api/diagnostics` returns grouped top-level sections rather than a flat field list.
- **D-02:** Phase 4 returns only Phase 4 data. Do not include empty placeholders for Phase 5 `agents` or `privacy` diagnostics.
- **D-03:** New diagnostics response fields use `camelCase`, matching `/api/version` and frontend TypeScript conventions.
- **D-04:** Phase 4 top-level groups are `version`, `health`, and `storage`.

### Health and Readiness Semantics
- **D-05:** `GET /api/diagnostics` returns HTTP 200 even when readiness is false so diagnostics remains inspectable.
- **D-06:** `/readyz` remains the strict readiness gate for non-200 readiness behavior.
- **D-07:** The `health` section includes simple semantic booleans: `live` and `ready`.
- **D-08:** When `ready` is false, include a generic machine-readable reason such as `database not ready`.
- **D-09:** Do not embed `/healthz` or `/readyz` HTTP status codes in the diagnostics response.

### Storage Facts and Empty States
- **D-10:** Expose the full resolved SQLite DB path.
- **D-11:** `storage.dbSizeBytes` is nullable when file size cannot be determined, such as `:memory:` or an unavailable file path.
- **D-12:** Include a generic reason such as `dbSizeReason: "unavailable"` when DB size is not measurable.
- **D-13:** Empty DB state returns `latestEventAt: null`.
- **D-14:** Phase 4 storage facts must not include raw captured content samples, latest action/path/source samples, raw payload bodies, prompts, diffs, or tool outputs.

### Aggregate Stat Definitions
- **D-15:** `totalSessions` counts rows in the `sessions` table. The session table is the source of truth for this field.
- **D-16:** `totalEvents` counts all stored event rows, including degraded normalized rows. Ignored events do not count because they are not stored.
- **D-17:** `latestEventAt` is the maximum stored event timestamp.
- **D-18:** Add a dedicated repository diagnostics aggregate method using targeted SQL aggregate queries such as `COUNT` and `MAX`, called through service and handler layers. Do not reuse dashboard flows that load/enrich session lists.

### the agent's Discretion
No areas were delegated to the agent. All selected gray areas were decided explicitly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Requirements
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, and plan split.
- `.planning/REQUIREMENTS.md` — Phase 4 mapped requirements DIAG-01, DIAG-02, DIAG-03, DIAG-04, and TEST-01.
- `.planning/PROJECT.md` — local-first/privacy constraints, stack constraints, and v1.1 Diagnostics milestone goal.
- `.planning/STATE.md` — current phase position and recent decisions affecting diagnostics work.

### Codebase Maps
- `.planning/codebase/STACK.md` — backend stack, Go/SQLite details, and test tooling.
- `.planning/codebase/ARCHITECTURE.md` — layered backend architecture and known service/repository patterns.
- `.planning/codebase/INTEGRATIONS.md` — local SQLite storage and incoming hook source context.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/internal/handler/version.go` — existing version JSON shape and `buildDate` camelCase precedent.
- `backend/internal/handler/health.go` — existing `/healthz` and `/readyz` semantics to reuse for `health.live` and `health.ready`.
- `backend/internal/version/version.go` — source for version, commit, and build date values.
- `backend/internal/config/config.go` — source for configured DB path behavior.

### Established Patterns
- Backend changes should follow the existing layered path: router -> handler -> `EventService` -> `repository.EventRepository` -> SQLite adapter.
- Repository-level aggregate work should use targeted SQLite queries, not service-level list/enrichment flows.
- Handlers encode JSON directly and set `Content-Type: application/json`.

### Integration Points
- Add route wiring in `backend/internal/server/router.go` for `GET /api/diagnostics`.
- Extend `backend/internal/repository/repository.go` with a dedicated diagnostics aggregate method and implement it in `backend/internal/repository/sqlite/sqlite.go`.
- Add service method(s) on `backend/internal/service/event_service.go` to compose version/health/storage diagnostics for the handler.
- Add backend tests near existing handler/service/router/repository test patterns under `backend/tests/`.

</code_context>

<specifics>
## Specific Ideas

No external product examples were referenced. The desired shape is a compact operator data contract that Phase 5 can extend later by adding new sections, not by pre-seeding empty placeholders in Phase 4.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Diagnostics Data Contract*
*Context gathered: 2026-05-27*
