---
phase: 04
slug: diagnostics-data-contract
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-28
updated: 2026-05-28
---

# Phase 04 - Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser or local client -> Go HTTP server | Operator or local tooling requests `GET /api/diagnostics`. | Operational metadata: version, readiness, DB path/size, aggregate counts, latest event timestamp. |
| HTTP handler -> EventService | Diagnostics handler asks the service to compose the response. | Typed diagnostics response fields only. |
| EventService -> EventRepository | Service requests storage aggregate stats from SQLite through the repository interface. | Counts and latest timestamp only; no event/session rows. |
| EventService -> local filesystem | Service calls `os.Stat` on the configured DB path to report file size. | DB path and size metadata. |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Information Disclosure | Diagnostics domain contract | mitigate | `domain.DiagnosticsStorage` contains only DB path, nullable DB size, total event/session counts, and latest timestamp. It has no raw event content, command, path sample, prompt, diff, raw payload, stdout, stderr, transcript, event row, or session row fields. | closed |
| T-04-02 | Denial of Service | SQLite diagnostics aggregate | mitigate | `DiagnosticsStorageStats` uses targeted SQL aggregate queries for counts and latest event ordering instead of loading event/session rows into Go memory. | closed |
| T-04-03 | Spoofing / Information Disclosure | Diagnostics route exposure | mitigate | `/api/diagnostics` is mounted through `server.NewRouter`, so existing `panicRecovery`, `hostHeader`, `corsAllowlist`, and `logging` middleware wrap the endpoint. | closed |
| T-04-04 | Information Disclosure | Diagnostics handler serialization | mitigate | `handler.Diagnostics` encodes only `domain.Diagnostics`; service composition uses repository aggregate stats and does not query or serialize captured event/session rows. Handler tests assert sensitive keys and seeded sensitive values are absent. | closed |
| T-04-05 | Verification Gap | Diagnostics regression tests | mitigate | Tests cover grouped response shape, absent `agents`/`privacy` placeholders, absent sensitive captured-content keys/values, not-ready behavior, empty DB nullability, aggregate counts, degraded event counting, and mixed-timezone latest timestamp ordering. | closed |

*Status: open - closed*
*Disposition: mitigate (implementation required) - accept (documented risk) - transfer (third-party)*

---

## Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-04-01 | `backend/internal/domain/diagnostics.go` defines only `version`, `health`, and `storage`; storage fields are DB path/size, counts, and latest timestamp. |
| T-04-02 | `backend/internal/repository/sqlite/sqlite.go` implements `DiagnosticsStorageStats` with `COUNT(*)` queries and an ordered latest-timestamp query. |
| T-04-03 | `backend/internal/server/router.go` mounts `GET /api/diagnostics` before returning `panicRecovery(hostHeader(corsAllowlist(...)(logging(mux))))`. |
| T-04-04 | `backend/internal/handler/diagnostics.go` encodes only `svc.Diagnostics(...)`; `backend/internal/service/event_service.go` composes only version, health, and storage aggregate fields. |
| T-04-05 | `backend/tests/internal/handler/diagnostics_test.go`, `backend/tests/internal/repository/sqlite/sqlite_test.go`, `backend/tests/internal/service/event_service_test.go`, and `backend/tests/internal/server/router_test.go` exercise the mitigations. |

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-28 | 5 | 5 | 0 | Codex |

## Verification Commands

- `(workdir: backend) rtk env GOCACHE=/private/tmp/hooker-gocache go test ./tests/internal/repository/sqlite -run 'Test.*Diagnostics'`
- `(workdir: backend) rtk env GOCACHE=/private/tmp/hooker-gocache go test ./tests/internal/service -run 'Test.*Diagnostics'`
- `(workdir: backend) rtk env GOCACHE=/private/tmp/hooker-gocache go test ./tests/internal/handler ./tests/internal/server -run 'Test.*Diagnostics|TestNewRouter.*Diagnostics'`
- `(workdir: backend) rtk env GOCACHE=/private/tmp/hooker-gocache go test ./...`

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-28
