# v1.1 Diagnostics Research — Stack

## Scope

Milestone v1.1 adds Diagnostics UI and supporting backend diagnostics data to the existing hooker app. This is a subsequent milestone, so stack changes should be minimal and should reuse v1.0 foundations.

## Existing Stack to Reuse

- **Backend:** Go stdlib HTTP handlers, `service.EventService`, `repository.EventRepository`, SQLite implementation in `backend/internal/repository/sqlite`.
- **Frontend:** React 19, React Router 7, TypeScript, Tailwind, existing shadcn-style primitives, lucide icons, Vitest/RTL.
- **Data:** Existing SQLite event/session tables already contain agent, session, event time, normalization status, normalizer version, and raw payload fields.
- **Existing endpoints:** `/healthz`, `/readyz`, `/api/version`, `/api/events`, `/api/sessions`, `/api/dashboard/stats`.
- **Existing config:** `config.Config` already exposes `DBPath`, `IgnorePath`, `CORSOrigins`, and `AllowRemote`.

## Stack Additions

No new runtime dependency is recommended for v1.1.

Diagnostics should be implemented with:

- A new backend domain struct for diagnostics response shape.
- A new repository method for compact diagnostics stats.
- A new service method that combines storage stats with runtime/config/version values.
- A new handler route, likely `GET /api/diagnostics`.
- A new frontend feature folder, likely `frontend/src/features/diagnostics/`.
- A new lazy route, likely `/diagnostics`.
- Existing UI primitives, `lucide-react` status icons, and restrained dashboard-style layout.

## Integration Points

| Area | Existing Pattern | Recommended Diagnostics Use |
|------|------------------|-----------------------------|
| Handler | `handler.DashboardStats(svc)` returns JSON and maps errors to HTTP status | Add `handler.Diagnostics(...)` returning one compact JSON object |
| Router | `server.NewRouter` receives `svc`, `repo`, `ready`, `Options` | Add diagnostics route with config/runtime inputs passed through `Options` or handler factory |
| Service | `EventService` wraps repository and enriches dashboard stats | Add `Diagnostics(...)` method that avoids expensive scans |
| Repository | SQLite methods return aggregate stats | Add targeted aggregate queries for counts, latest event, degraded count, normalizer versions |
| Frontend hook | `useDashboardStats` normalizes JSON and handles loading/error | Add `useDiagnostics` with explicit default normalization |
| Frontend route | `App.tsx` lazy-loads feature pages | Add lazy `DiagnosticsPage` and sidebar nav item |

## What Not To Add

- No new charting library; diagnostics is status-oriented, not analytics.
- No polling framework; a manual refresh button plus optional simple interval is enough.
- No OS-level process monitor; only app-owned state should be shown.
- No DB mutation controls in v1.1; vacuum/checkpoint actions are future work.

## Version Notes

No external API/version lookup is needed for this milestone because the recommended stack uses existing project dependencies and Go stdlib APIs.
