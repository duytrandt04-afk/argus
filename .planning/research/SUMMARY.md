# v1.1 Diagnostics Research — Summary

## Recommendation

Build Diagnostics as a read-only operator page backed by one compact backend diagnostics endpoint. The milestone should focus on install trust: system health, hook connectivity, and privacy posture.

## Stack Additions

No new dependencies are recommended.

Use existing:

- Go stdlib handlers and SQLite queries.
- `EventService` / `EventRepository` layering.
- React Router lazy route.
- Existing UI primitives, Tailwind, lucide icons.
- Vitest/RTL and backend Go tests.

## Table Stakes

- `GET /api/diagnostics` returns version, readiness, DB path/size, event/session counts, latest event, degraded counts, agent summaries, ignore-file status, and remote-bind/privacy posture.
- Diagnostics page shows a high-signal status summary, system facts, agent hook table, and privacy panel.
- Hook connectivity separates "configured", "last seen", "stale", "degraded", and "unknown" states.
- Privacy panel avoids sensitive raw content and shows only safe status/counts plus export warning.
- Tests cover backend response shape and frontend loading/error/healthy/warning states.

## Architecture

Recommended backend path:

```text
handler.Diagnostics -> service.Diagnostics -> repository.DiagnosticsStats -> sqlite aggregate queries
```

Recommended frontend path:

```text
App route /diagnostics -> DiagnosticsPage -> useDiagnostics -> GET /api/diagnostics
```

## Watch Outs

- Keep v1.1 read-only. DB maintenance and config repair are future work.
- Avoid full-table scans and in-memory aggregation.
- Do not expose raw prompts, diffs, tool outputs, raw payloads, or captured text in diagnostics.
- Do not overstate hook configuration certainty; use `unknown` when detection is not implemented.
- Keep the UI operational and compact, not marketing-like and not analytics-heavy.

## Suggested Requirement Categories

- **DIAG:** System health and storage facts.
- **HOOK:** Agent hook connectivity and warning states.
- **PRIV:** Privacy/security posture.
- **UI:** Diagnostics page and navigation.
- **TEST:** Backend and frontend regression coverage.
