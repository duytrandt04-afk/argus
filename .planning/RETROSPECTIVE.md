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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | not tracked | 3 | Established GSD milestone archive, audit, and deferred-item close-out loop |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | Backend, frontend, and Playwright smoke suites | Not measured | Privacy matcher implemented in-tree after dependency checkpoint |

### Top Lessons (Verified Across Milestones)

1. Requirement traceability must be updated during phase close, not deferred to milestone close.
2. Human runtime verification should be scheduled as explicit UAT as soon as implementation lands.
