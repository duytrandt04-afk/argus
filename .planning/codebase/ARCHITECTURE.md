<!-- refreshed: 2026-05-24 -->
# Architecture

**Analysis Date:** 2026-05-24

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 Runtime Entry & Delivery                    │
├──────────────────┬──────────────────┬───────────────────────┤
│ API server       │ Watcher worker   │ Frontend SPA          │
│ `backend/cmd/    │ `backend/cmd/    │ `frontend/src`        │
│ server/main.go`  │ watcher/main.go` │                       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  HTTP + Application Layer                   │
│ `backend/internal/server` `backend/internal/handler`        │
│ `backend/internal/service`                                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│           Persistence + Embedded UI + Domain Models         │
│ `backend/internal/repository/sqlite` `backend/internal/ui`  │
│ `backend/internal/domain`                                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| API bootstrap | Build config, repository, service, and router, then start server | `backend/cmd/server/main.go` |
| Router | Map API/UI routes and apply middleware | `backend/internal/server/router.go` |
| Handlers | Convert HTTP requests into service calls and encode responses | `backend/internal/handler/*.go` |
| Service | Own event/session/dashboard workflows and SSE subscriptions | `backend/internal/service/event_service.go` |
| Repository contract | Define storage boundary used by service | `backend/internal/repository/repository.go` |
| SQLite adapter | Run migrations and execute SQL for events/sessions/aggregates | `backend/internal/repository/sqlite/sqlite.go` |
| Embedded UI handler | Serve `dist/` static files and SPA fallback | `backend/internal/ui/ui.go` |
| Frontend app shell | Browser route tree with lazy page loading | `frontend/src/App.tsx` |

## Pattern Overview

**Overall:** Layered monolith (Go backend + embedded React SPA) with feature-sliced frontend modules.

**Key Characteristics:**
- HTTP layer depends only on `EventService`.
- Service layer depends on `EventRepository` interface, not concrete SQLite type.
- Frontend reads backend via `/api/*` and is served by the same Go process in production.

## Layers

**Entry/Delivery Layer:**
- Purpose: Start processes and mount client app.
- Location: `backend/cmd/server`, `backend/cmd/watcher`, `frontend/src/main.tsx`
- Contains: Server bootstrap, watcher loop, React root mount.
- Depends on: Router/service/repository and browser runtime.
- Used by: Operators and browser clients.

**HTTP Layer:**
- Purpose: Route, validate, and serialize HTTP/SSE traffic.
- Location: `backend/internal/server`, `backend/internal/handler`
- Contains: Route map, CORS/logging middleware, endpoint handlers.
- Depends on: `backend/internal/service`.
- Used by: Hook senders and frontend API calls.

**Application Layer:**
- Purpose: Central event/session/usage orchestration.
- Location: `backend/internal/service`
- Contains: `AddEvent`, list/query methods, dashboard enrichment, SSE fanout.
- Depends on: `repository.EventRepository`, agent usage calculators.
- Used by: All handlers.

**Persistence + Domain Layer:**
- Purpose: Durable storage and shared data contracts.
- Location: `backend/internal/repository`, `backend/internal/repository/sqlite`, `backend/internal/domain`
- Contains: Storage interface, SQLite queries/migrations, domain structs.
- Depends on: SQL driver `modernc.org/sqlite`.
- Used by: Service and tests.

## Data Flow

### Primary Request Path

1. Bootstrap wires `config -> sqlite.New -> service.New -> server.NewRouter` (`backend/cmd/server/main.go:18`).
2. `POST /api/hook` is registered and dispatched by router (`backend/internal/server/router.go:14`).
3. Hook handler normalizes payload and calls `svc.AddEvent` (`backend/internal/handler/hook.go:18`).
4. Service persists event, updates session usage, then broadcasts to SSE subscribers (`backend/internal/service/event_service.go:26`).
5. SQLite adapter inserts event/session rows (`backend/internal/repository/sqlite/sqlite.go:100`).

### Secondary Flow Name

1. Browser mounts app root (`frontend/src/main.tsx:1`).
2. App route tree lazy-loads pages (`frontend/src/App.tsx:1`).
3. Hooks fetch `/api/*` endpoints and update local state (example `frontend/src/hooks/useSessions.ts:14`).

**State Management:**
- Backend shared mutable state is `EventService.subscribers` (`sync.Map`) in `backend/internal/service/event_service.go`.
- Frontend state is local React hook/component state, with periodic polling in some hooks (`frontend/src/hooks/useSessions.ts`).

## Key Abstractions

**EventRepository:**
- Purpose: Storage boundary between service and persistence.
- Examples: `backend/internal/repository/repository.go`, `backend/internal/repository/sqlite/sqlite.go`
- Pattern: Interface + adapter.

**EventService:**
- Purpose: Application use-case facade for handlers.
- Examples: `backend/internal/service/event_service.go`
- Pattern: Single orchestrator service.

**Agent Normalizers:**
- Purpose: Convert source-specific payloads into `domain.NormalizedEvent`.
- Examples: `backend/internal/agents/claudecode`, `backend/internal/agents/codex`, `backend/internal/agents/geminicli`
- Pattern: Handler-selected strategy by transcript/source metadata.

## Entry Points

**API Server:**
- Location: `backend/cmd/server/main.go`
- Triggers: Process startup.
- Responsibilities: Dependency wiring and HTTP lifecycle.

**Watcher Worker:**
- Location: `backend/cmd/watcher/main.go`
- Triggers: Worker startup.
- Responsibilities: Poll transcript JSONL files and emit tool hooks.

**Frontend Mount:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser load.
- Responsibilities: Mount React tree.

## Architectural Constraints

- **Threading:** Concurrent request goroutines; SQLite serializes writes with busy/write timeouts in `backend/internal/repository/sqlite/sqlite.go`.
- **Global state:** Embedded dist filesystem in `backend/internal/ui/ui.go`; SSE subscriber registry in `backend/internal/service/event_service.go`.
- **Circular imports:** Not detected from indexed symbols.
- **Other constraint:** UI deployment is coupled to backend binary via embedded `dist/` assets in `backend/internal/ui/ui.go`.

## Anti-Patterns

### Service Concentration

**What happens:** `EventService` owns ingestion, aggregation, usage backfill, and stream fanout.
**Why it's wrong:** Large change surface and higher coupling risk.
**Do this instead:** Split focused internal services behind `repository.EventRepository` while keeping existing handler contracts.

### Repeated Query Parsing

**What happens:** Multiple handlers parse page/size/since params independently.
**Why it's wrong:** Inconsistent defaults and validation drift.
**Do this instead:** Reuse shared parsing helpers under `backend/internal/handler` or `backend/internal/server`.

## Error Handling

**Strategy:** Return early for invalid input; degrade on non-critical downstream failures.

**Patterns:**
- Handlers use `http.Error` for malformed input or list/query failures (`backend/internal/handler/hook.go`, `backend/internal/handler/events.go`, `backend/internal/handler/sessions.go`).
- Hook endpoint can return accepted empty JSON when storage fails after parsing (`backend/internal/handler/hook.go`).

## Cross-Cutting Concerns

**Logging:** Request timing middleware plus endpoint logs (`backend/internal/server/middleware.go`, `backend/internal/handler/hook.go`).
**Validation:** Endpoint-local validation in handler functions.
**Authentication:** No auth middleware detected; wildcard CORS in `backend/internal/server/middleware.go`.

---

*Architecture analysis: 2026-05-24*
