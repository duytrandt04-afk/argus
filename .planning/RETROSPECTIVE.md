# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-27  
**Phases:** 3 | **Plans:** 19 | **Tasks:** 30

### What Was Built

- Source-install baseline with setup/doctor tooling, build-first docs, CI, and release packaging.
- Reliable daily-use foundation: transactional migrations, raw payload archive, degraded ingestion, export endpoints, backend hardening, and regression tests.
- Mature local-product posture: privacy ignore rules, CORS allowlist, remote-bind opt-in, privacy/security docs, contributor guide, and ADRs.

### What Worked

- Coarse phase granularity kept the milestone focused while still letting execution split into parallel plan waves.
- TDD-style implementation worked well for migration, privacy, CORS, export, and frontend regression coverage.
- Treating privacy and local-first security as product requirements produced concrete guardrails instead of vague docs-only promises.

### What Was Inefficient

- Requirements traceability drifted after implementation; `DIAG-03`, `DIAG-05`, and `REL-05` were implemented but left unchecked until milestone audit.
- Some phase summaries lacked clean one-line extraction metadata, which produced noisy milestone accomplishments from the SDK archive step.
- Human runtime checks accumulated at the end instead of being burned down immediately after the relevant phase.

### Patterns Established

- Runtime metadata should be fetched from backend endpoints rather than baked into frontend constants.
- Sensitive-data controls must gate ingestion before persistence and SSE broadcast.
- Remote access should require explicit opt-in and a warning that names captured data categories.
- Frontend-backend contract changes need synchronized Go domain types, TypeScript types, fixtures, and tests.

### Key Lessons

1. Update `REQUIREMENTS.md` immediately when a verifier confirms implementation, even if a human runtime check remains.
2. Keep `requirements-completed` and one-line summary metadata consistent so milestone archiving produces useful history.
3. Convert human-needed verification into either same-phase UAT or explicitly deferred close-out items before milestone completion.

### Cost Observations

- Model mix: not tracked for v1.0.
- Sessions: not tracked for v1.0.
- Notable: most rework came from documentation and traceability drift, not implementation failures.

---

## Milestone: v1.1 — Diagnostics

**Shipped:** 2026-05-29
**Phases:** 3 (04–06) | **Plans:** 9 | **Tasks:** 20

### What Was Built

- Backend diagnostics contract: `GET /api/diagnostics` with version, health/readiness, storage facts, Claude Code/Codex agent telemetry, hook config status, privacy ignore posture, remote-bind/CORS posture, and export sensitivity warning.
- `hookconfig` Go package for doctor-equivalent Claude Code and Codex config detection without shelling out.
- React DiagnosticsPage with 7 state branches, 4 summary tiles, agent connectivity table, system facts card, privacy & security card, and responsive two-column layout.
- 176/176 backend tests and 87/87 frontend tests — all state branches, route, and sidebar navigation covered.

### What Worked

- Sequential wave structure (04 → 05 → 06) produced clean dependency layering with zero integration surprises.
- Keeping diagnostics domain structs separate from event/session domain from the start prevented model mixing.
- Aggregate-only repository methods (`DiagnosticsStorageStats`, `DiagnosticsAgentStats`) kept the privacy boundary crisp.
- Audit-driven gap closure at milestone boundary worked well: 2 gaps identified (Gemini CLI scope, status mismatch), both fixed before archive.

### What Was Inefficient

- Phase 6 SUMMARY.md files missing `requirements-completed` frontmatter; all 6 requirements covered in VERIFICATION.md but SDK extraction will not surface them automatically.
- No VALIDATION.md (Nyquist) for any v1.1 phase — validation files were not generated during execution.
- React StrictMode phantom effect (blank page crash) required an extra fix commit after phase close; this should be caught during plan review.
- Agent status `"ok"` vs `"healthy"` mismatch reached audit rather than being caught during frontend-backend contract review.

### Patterns Established

- `server.Options` as the extension point for diagnostics-specific runtime inputs (DB path, hook config, privacy posture) — avoids widening `NewRouter` positional parameters.
- `LoadedContent` sub-component pattern for TypeScript narrowing in React pages with non-null data.
- `vi.stubGlobal('fetch')` for all diagnostics tests; `vi.spyOn(Storage.prototype)` is prohibited per Phase 2 decision.
- Deferred promise (`resolveRefresh`) pattern for testing manual-refresh button state precisely.

### Key Lessons

1. Frontend-backend contract validation requires test fixtures to match real API output, not hand-crafted idealizations. Gemini CLI fixture masked the real backend limitation.
2. Go switch statements on status strings fail silently at the default case — validate string constants at the contract boundary during implementation, not at audit.
3. React async hooks need mounted guards in `finally` blocks, not just `then` — StrictMode double-invocation unmounts before `finally` runs.
4. Requirement scope adjustments (HOOK-01) should be noted in requirements immediately when the decision is made, not left as drift until audit.

### Cost Observations

- Model mix: not tracked for v1.1.
- Sessions: ~8 working sessions across 3 phases.
- Notable: 2-day execution from domain structs to shipped UI — sequential wave structure and clear phase contracts produced efficient handoffs.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | not tracked | 3 | Established GSD milestone archive, audit, and deferred-item close-out loop |
| v1.1 | ~8 sessions | 3 | Sequential wave structure; audit-driven gap closure; `server.Options` pattern for diagnostics inputs |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Backend, frontend, and Playwright smoke suites | Not measured | Privacy matcher implemented in-tree after dependency checkpoint |
| v1.1 | 176 backend + 87 frontend (263 total) | Not measured | hookconfig detector added in-process; no new external dependencies |

### Top Lessons (Verified Across Milestones)

1. Requirement traceability must be updated during phase close, not deferred to milestone close.
2. Human runtime verification should be scheduled as explicit UAT as soon as implementation lands.
3. Frontend-backend string contract values (status enums, JSON field names) must be validated at implementation time, not discovered at audit.
4. React async hooks need mounted guards in `finally` blocks as a standard pattern — document in CONVENTIONS.md.
