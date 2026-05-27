# Milestones

## v1.0 MVP (Shipped: 2026-05-27)

**Phases completed:** 3 phases, 19 plans, 30 tasks  
**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md), [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md), [v1.0-MILESTONE-AUDIT.md](milestones/v1.0-MILESTONE-AUDIT.md)

### Key Accomplishments

- Established source-install adoption path with setup/doctor tooling, build-first quickstart, install docs, release runbook, and a concise README.
- Added CI and release infrastructure: backend/frontend quality gates, pnpm enforcement, GoReleaser v2, tag-only releases, and checksums.
- Wired runtime diagnostics across backend and frontend: `/healthz`, `/readyz`, `/api/version`, startup diagnostics, resolved DB path logging, and the sidebar version badge.
- Hardened daily-use reliability with transactional migrations, raw payload storage, normalization metadata, degraded ingestion, HTTP timeouts, graceful shutdown, panic recovery, WAL checkpointing, and structured logging.
- Shipped data portability with streaming NDJSON export and full-fidelity SQLite snapshot export, protected by `Sec-Fetch-Site`.
- Added regression coverage across backend migrations/normalization/export, frontend hooks/components, and Playwright smoke wiring.
- Enforced local-first privacy and security posture with gitignore-style ignore rules, no-store/no-SSE privacy gate, explicit CORS allowlist, loopback-only default bind, and remote-bind opt-in warning.
- Documented mature contributor guardrails through `CONTRIBUTING.md`, frontend-backend contract checklist, adapter fixture requirements, and accepted ADRs.

### Known Deferred Items at Close

3 open human-verification items were acknowledged and deferred at milestone close; see `.planning/STATE.md` Deferred Items.

---
