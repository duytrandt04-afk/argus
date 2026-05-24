# Codebase Concerns

**Analysis Date:** 2026-05-24

## Tech Debt

**Monolithic SQLite repository layer:**
- Issue: Data access, query composition, migrations, and session-tree assembly are concentrated in one large file.
- Files: `backend/internal/repository/sqlite/sqlite.go`
- Impact: Higher regression risk for routine schema/query changes and slower review cycles.
- Fix approach: Split by responsibility (`migrations`, `events`, `sessions`, `traces`, `stats`) behind the same repository interface in `backend/internal/repository/repository.go`.

**Usage aggregation logic concentrated in one service:**
- Issue: Session enrichment, usage backfill, model rollups, and date-range filtering are tightly coupled.
- Files: `backend/internal/service/event_service.go`
- Impact: Small behavior changes can unintentionally affect dashboard totals and session reporting.
- Fix approach: Extract pure usage-aggregation helpers into dedicated package-level units with table-driven tests.

**Duplicated API pagination/transformation paths in frontend usage hook:**
- Issue: Primary vs fallback page-fetchers and provider-specific transforms are repeated in a single hook.
- Files: `frontend/src/features/usage/hooks/useOpenAIUsage.ts`
- Impact: Maintenance overhead and drift risk between OpenAI and Anthropic logic.
- Fix approach: Factor provider adapters and shared pagination into smaller utilities under `frontend/src/features/usage/hooks/`.

## Known Bugs

**Proxy route behavior mismatch risk for non-GET requests:**
- Symptoms: Proxy handlers build upstream requests with `r.Method`, but router only exposes `GET` routes; non-GET requests are rejected before handler execution.
- Files: `backend/internal/server/router.go`, `backend/internal/handler/proxy.go`, `backend/tests/internal/server/router_test.go`
- Trigger: Sending `POST`/`PUT` to `/api/openai/*` or `/api/anthropic/*`.
- Workaround: Use `GET` only for current endpoints.

## Security Considerations

**Unauthenticated ingestion endpoint:**
- Risk: Any local-network caller that can reach backend can submit events to `/api/hook`.
- Files: `backend/internal/server/router.go`, `backend/internal/handler/hook.go`
- Current mitigation: Server binds to loopback by default (`127.0.0.1:8765`) in `backend/internal/config/config.go`.
- Recommendations: Add optional shared-secret or token auth on `/api/hook`, plus explicit allowlist for trusted local clients.

**Permissive CORS policy:**
- Risk: `Access-Control-Allow-Origin: *` allows any origin to call readable endpoints when backend is reachable.
- Files: `backend/internal/server/middleware.go`
- Current mitigation: None beyond network reachability assumptions.
- Recommendations: Restrict allowed origins through config and narrow allowed headers/methods by endpoint class.

**API key persistence in browser localStorage:**
- Risk: Admin key is persisted unencrypted and is accessible to any script running in page context.
- Files: `frontend/src/features/usage/hooks/useOpenAIUsage.ts`
- Current mitigation: None in UI code.
- Recommendations: Prefer ephemeral in-memory keys; if persistence is required, gate it behind explicit opt-in and clear-key controls.

## Performance Bottlenecks

**On-demand transcript backfill on read paths:**
- Problem: Listing sessions/dashboard can trigger usage recomputation from transcript files.
- Files: `backend/internal/service/event_service.go`, `backend/internal/agents/codex/codex.go`, `backend/internal/agents/claudecode/claudecode.go`, `backend/internal/agents/geminicli/geminicli.go`
- Cause: `backfillSessionUsage` computes and writes usage during read endpoints when usage is missing.
- Improvement path: Move usage computation to ingestion time only, and backfill asynchronously with a bounded worker.

**Heavy SQLite query and mapping surface in one module:**
- Problem: Multiple list/filter/tree/stat queries and JSON unmarshalling run in a single high-traffic repository file.
- Files: `backend/internal/repository/sqlite/sqlite.go`
- Cause: Centralized query logic with broad responsibilities.
- Improvement path: Isolate hot-path queries and add query-level benchmarks for sessions/traces/dashboard endpoints.

## Fragile Areas

**Event normalization branching across agent types:**
- Files: `backend/internal/handler/hook.go`, `backend/internal/agents/codex/codex.go`, `backend/internal/agents/claudecode/claudecode.go`, `backend/internal/agents/geminicli/geminicli.go`
- Why fragile: Routing depends on transcript/source heuristics; schema drift in any agent payload can mis-normalize events.
- Safe modification: Add normalization fixtures per agent and verify expected `domain.NormalizedEvent` fields before merge.
- Test coverage: Parser-focused tests exist for agents, but integration coverage across full hook ingestion permutations is limited.

## Scaling Limits

**SQLite single-writer constraint under bursty hook traffic:**
- Current capacity: Busy timeout (`750ms`) and write timeout (`1500ms`) with WAL mode; writes still serialized.
- Limit: Concurrent hook bursts can hit lock contention and drop throughput.
- Files: `backend/internal/repository/sqlite/sqlite.go`
- Scaling path: Introduce buffered write queue/batching or move to a server database when sustained concurrent writes are required.

## Dependencies at Risk

**`modernc.org/sqlite` version lock sensitivity:**
- Risk: Driver behavior changes can affect locking, pragma behavior, and migration/runtime query semantics.
- Impact: Event ingestion latency and read consistency can regress after dependency upgrades.
- Files: `backend/go.mod`, `backend/internal/repository/sqlite/sqlite.go`
- Migration plan: Pin and upgrade deliberately with lock-contention and migration smoke tests in CI.

## Missing Critical Features

**No auth/rate-limiting controls for API surface:**
- Problem: API endpoints rely on local deployment assumptions instead of explicit access controls.
- Blocks: Safe exposure beyond strictly local-only development environments.
- Files: `backend/internal/server/router.go`, `backend/internal/server/middleware.go`, `backend/internal/handler/hook.go`

## Test Coverage Gaps

**Frontend usage hook behavior not directly tested:**
- What's not tested: Caching behavior, API key persistence semantics, and provider pagination/error fallback in `useOpenAIUsage`.
- Files: `frontend/src/features/usage/hooks/useOpenAIUsage.ts`, `frontend/tests/features/usage/`
- Risk: Silent regressions in charts/totals and key handling UX.
- Priority: High

**Proxy handler behavior not directly unit tested:**
- What's not tested: Header forwarding, upstream error propagation, and path/query passthrough for proxy handlers.
- Files: `backend/internal/handler/proxy.go`, `backend/tests/internal/handler/`
- Risk: Integration breakage when proxy logic changes.
- Priority: Medium

---

*Concerns audit: 2026-05-24*
