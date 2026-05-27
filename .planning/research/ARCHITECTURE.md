# v1.1 Diagnostics Research — Architecture

## Existing Architecture

hooker is a layered Go monolith with embedded React SPA:

- `config` resolves runtime settings such as `DBPath`, `IgnorePath`, CORS origins, and remote-bind opt-in.
- `handler` owns HTTP request/response shape.
- `service.EventService` coordinates repository reads and domain enrichment.
- `repository.EventRepository` abstracts persistence.
- `repository/sqlite` owns SQL and storage details.
- `server.NewRouter` wires handlers, middleware, static UI, readiness, CORS, and privacy matcher.
- Frontend pages are lazy-loaded via `App.tsx`; navigation lives in `Sidebar.tsx`.

## Recommended Backend Shape

Add diagnostics as a read-only capability:

```text
config.Config
    ↓
server.NewRouter(..., opts)
    ↓
handler.Diagnostics(...)
    ↓
service.Diagnostics(...)
    ↓
repository.DiagnosticsStats()
    ↓
sqlite aggregate queries + os.Stat(DBPath)
```

Recommended domain structures:

- `domain.Diagnostics`
- `domain.DiagnosticsSystem`
- `domain.DiagnosticsAgent`
- `domain.DiagnosticsPrivacy`
- `domain.DiagnosticsWarning`

Repository stats should be deliberately compact:

- `total_events`
- `total_sessions`
- `last_event_at`
- agent-level event counts and last seen
- agent-level degraded counts
- normalizer versions by agent

Use SQL aggregates, not `ListEvents(defaultLimit)` plus in-memory guesses. This keeps diagnostics fast even when the DB grows.

## Runtime Inputs

Diagnostics needs data not owned by SQLite:

- Version info from `internal/version`.
- DB path from `config.Config.DBPath`.
- Ignore path from `config.Config.IgnorePath`.
- Remote-bind posture from `config.Config.Addr` and `AllowRemote`.
- Readiness from `repo.Ready()` or the existing `ready` callback.
- Ignore file status from lightweight filesystem inspection or matcher load metadata.

Avoid exposing raw ignore pattern text by default. Pattern count and status are safer and enough for v1.1.

## Recommended Frontend Shape

```text
frontend/src/features/diagnostics/
  DiagnosticsPage.tsx
  useDiagnostics.ts
  diagnostics-types.ts
  DiagnosticsSummary.tsx
  AgentHealthTable.tsx
  PrivacyPanel.tsx
```

Add:

- Lazy route `/diagnostics` in `App.tsx`.
- Sidebar nav item with a lucide status-oriented icon.
- Tests under `frontend/tests/features/diagnostics/`.

## Data Flow

1. User opens `/diagnostics`.
2. `useDiagnostics` fetches `GET /api/diagnostics`.
3. Backend computes fresh read-only diagnostics.
4. UI renders:
   - top status summary
   - system/storage facts
   - agent connectivity table
   - privacy/security posture
5. User can manually refresh.

## Build Order

1. Backend domain/repository/service/handler route with tests.
2. Frontend hook/types/page and sidebar route with tests.
3. Polish states and warning copy.

This order gives the UI a stable response contract before visual work starts.
