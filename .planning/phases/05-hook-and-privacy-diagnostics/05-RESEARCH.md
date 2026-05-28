# Phase 5: Hook and Privacy Diagnostics - Research

**Researched:** 2026-05-28
**Status:** Ready for planning

## Research Complete

Phase 5 should extend the existing `GET /api/diagnostics` backend contract without changing the read-only, local-first posture established in Phase 4.

## Key Findings

### Existing Diagnostics Path

- `backend/internal/domain/diagnostics.go` currently defines `Diagnostics` with `version`, `health`, and `storage` groups.
- `backend/internal/handler/diagnostics.go` calls `svc.Diagnostics(dbPath, ready())` and JSON-encodes the grouped response.
- `backend/internal/service/event_service.go` composes version, readiness, and storage facts.
- `backend/internal/repository/sqlite/sqlite.go` already has `DiagnosticsStorageStats()` using targeted SQL aggregate queries.
- Existing diagnostics tests assert that Phase 4 does not expose `agents` or `privacy`; those assertions must change in Phase 5 while preserving captured-content leak checks.

### Agent Telemetry

- Session rows contain `agent`, `last_seen_at`, and usage metadata. The user chose session-based `eventCount` and `lastSeen` where possible.
- Event rows contain `normalization_status`, `normalizer_version`, `agent_version`, `source`, and `transcript_path`, which are needed for degraded counts and latest normalizer version.
- Repository work should add a dedicated diagnostics aggregate method, not reuse dashboard flows or load full event/session lists.
- Phase 5 should always return Claude Code and Codex rows only. Gemini CLI is deferred despite current roadmap/requirements text.

### Hook Config Detection

- `scripts/hooker doctor` detects Claude Code via `~/.claude/settings.json` and Codex via `~/.codex/hooks.json`.
- Current shell behavior searches config files for `8765/api/hook`.
- Planning should create a Go detector with equivalent paths and endpoint matching. It should be structured for future doctor reuse, but this phase does not need to rewrite the shell script.
- Missing config or config without the endpoint maps to `missing`. Unreadable or invalid config maps to `unknown` with a non-sensitive reason code.

### Privacy and Security Posture

- Runtime config already exposes `Addr`, `IgnorePath`, `CORSOrigins`, and `AllowRemote` in `backend/internal/config/config.go`.
- `ignore.Load(path)` returns an empty matcher with no error for missing files and errors for unreadable files. It currently does not expose the active rule count, so Phase 5 needs a safe count accessor or loader status helper.
- CORS diagnostics should not list full origins. Report total count plus local/default vs extra counts.
- Export sensitivity warning should be a stable canonical string covering prompts, diffs, file paths, tool outputs, raw payloads, and exports.

## Recommended Plan Split

1. `05-01`: Add diagnostics domain and repository/service telemetry aggregates for Claude Code and Codex.
2. `05-02`: Add Go hook config detector and wire hook status into diagnostics.
3. `05-03`: Add privacy/security posture diagnostics, route/config plumbing, and backend coverage for no-content-leak behavior.

## Risks

- Roadmap and requirements still mention Gemini CLI. Plans must explicitly follow `05-CONTEXT.md` D-01/D-05 and defer Gemini.
- Extending repository interfaces will require updating hand-written test doubles in handler, service, and server tests.
- Avoiding full origin lists and raw ignore pattern text is a privacy requirement, not a UI preference.

## Open Questions

None. All Phase 5 implementation decisions were captured in `05-CONTEXT.md`.

---

## RESEARCH COMPLETE
