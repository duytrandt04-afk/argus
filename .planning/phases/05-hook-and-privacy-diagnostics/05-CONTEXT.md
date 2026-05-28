# Phase 5: Hook and Privacy Diagnostics - Context

**Gathered:** 2026-05-28T03:38:09Z
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 extends the read-only `GET /api/diagnostics` backend contract with hook connectivity and privacy/security posture data. It should report Claude Code and Codex hook/activity diagnostics, ignore-file posture, remote-bind/CORS posture, and export sensitivity warnings without exposing raw captured content or raw ignore patterns. Frontend rendering belongs to Phase 6.

Important scope note: the current roadmap and requirements still mention Gemini CLI for Phase 5, but the user decided during discussion to defer Gemini CLI diagnostics and focus Phase 5 on Claude Code and Codex first. Downstream planning should reconcile `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` before treating Gemini CLI as in scope.

</domain>

<decisions>
## Implementation Decisions

### Agent Telemetry Rows
- **D-01:** Phase 5 diagnostics uses a two-agent contract: always show Claude Code and Codex rows. Gemini CLI diagnostics are deferred.
- **D-02:** Supported-agent `eventCount` and `lastSeen` should be session-based where possible.
- **D-03:** Degraded events should attach to Claude Code or Codex only when the agent can be inferred from source/transcript data. Otherwise, keep degraded events in an unknown/internal summary rather than forcing them into a supported row.
- **D-04:** Each supported agent row reports the latest observed non-empty `normalizerVersion`, or `null` when none exists.

### Hook Config Status
- **D-05:** Actively detect Claude Code and Codex config only. Do not include a Gemini CLI row with `unknown` status in Phase 5.
- **D-06:** If a Claude/Codex config file exists but does not contain the hooker endpoint, report `missing`.
- **D-07:** If a Claude/Codex config file cannot be read or parsed safely, report `unknown` with a non-sensitive reason code.
- **D-08:** Implement hook config detection in Go with equivalent paths and endpoint-matching semantics to `scripts/hooker doctor`, structured so doctor can share it later if useful.

### Status Severity Rules
- **D-09:** If an agent config is `configured` but no activity has been observed, report a `no events` warning.
- **D-10:** Backend should not enforce a stale threshold. It reports timestamps and counts; Phase 6 UI can decide stale presentation.
- **D-11:** Any degraded activity for a supported agent produces a warning, but never makes overall diagnostics unhealthy or fatal.
- **D-12:** Backend exposes per-agent status only. Do not compute an overall agent connectivity rollup in Phase 5.

### Privacy and Security Posture
- **D-13:** Ignore-file diagnostics expose ignore file path, load status, and active pattern count. Never expose raw ignore patterns.
- **D-14:** A missing ignore file is safe/OK with zero active rules, not an error.
- **D-15:** CORS diagnostics expose counts and local-vs-extra origin split. Do not expose the full origin list.
- **D-16:** Backend provides a stable canonical export sensitivity warning covering prompts, diffs, file paths, tool outputs, raw payloads, and exports.

### the agent's Discretion
No areas were delegated to the agent. All selected gray areas were decided explicitly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Requirements
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, and current plan split. Note the Gemini CLI conflict with D-01/D-05 above.
- `.planning/REQUIREMENTS.md` — Phase 5 mapped HOOK and PRIV requirements. Note the Gemini CLI conflict with D-01/D-05 above.
- `.planning/PROJECT.md` — local-first/privacy constraints, stack constraints, and v1.1 Diagnostics milestone goal.
- `.planning/STATE.md` — current phase position and recent decisions affecting diagnostics work.
- `.planning/phases/04-diagnostics-data-contract/04-CONTEXT.md` — Phase 4 diagnostics response-shape, health/readiness, storage, and privacy-boundary decisions carried forward.

### Codebase Maps
- `.planning/codebase/STACK.md` — backend stack, Go/SQLite details, and test tooling.
- `.planning/codebase/ARCHITECTURE.md` — layered backend architecture, repository/service/handler patterns, and known service concentration concern.
- `.planning/codebase/INTEGRATIONS.md` — incoming hook source context and local SQLite/config integration notes.

### Existing Docs and Scripts
- `scripts/hooker` — current setup/doctor hook config paths and endpoint matching for Claude Code and Codex.
- `docs/hooks.md` — documented hook setup for Codex, Claude Code, and Gemini CLI.
- `docs/privacy.md` — privacy posture and ignore-file behavior.
- `docs/security.md` — loopback/remote-bind and CORS/security posture guidance.
- `docs/adr/0002-hook-normalization-strategy.md` — accepted normalization strategy across agent payloads.
- `docs/adr/0003-local-first-positioning.md` — accepted local-first and remote-sharing posture.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/internal/domain/diagnostics.go` — existing grouped diagnostics domain model (`version`, `health`, `storage`) to extend with hook and privacy sections.
- `backend/internal/handler/diagnostics.go` — existing diagnostics handler that calls `EventService.Diagnostics`.
- `backend/internal/service/event_service.go` — existing diagnostics composition point and DB-size behavior.
- `backend/internal/repository/repository.go` and `backend/internal/repository/sqlite/sqlite.go` — existing repository boundary and targeted aggregate query pattern from Phase 4.
- `backend/internal/config/config.go` — source for `Addr`, `IgnorePath`, `CORSOrigins`, and `AllowRemote`.
- `backend/internal/privacy/ignore/ignore.go` — ignore-file loader and matcher. It currently hides raw sensitive fields and treats missing files as empty matcher/no error.
- `scripts/hooker` — doctor/setup currently detect Claude Code at `~/.claude/settings.json` and Codex at `~/.codex/hooks.json` by searching for `8765/api/hook`.

### Established Patterns
- Backend diagnostics should follow router -> handler -> service -> repository layers.
- New diagnostics aggregates should use targeted SQLite aggregate queries rather than loading event/session lists into memory.
- Diagnostics response fields should use `camelCase`.
- Diagnostics remains read-only and should avoid raw captured content, raw ignore pattern text, local hostnames, and arbitrary payload samples.

### Integration Points
- Extend `domain.Diagnostics` with hook/agent and privacy/security sections.
- Extend the repository contract with agent/session/degraded/normalizer aggregate data needed by the service.
- Add Go hook config detector for Claude Code and Codex, likely under a focused backend package rather than embedding shell/grep logic in handlers.
- Pass config posture (`IgnorePath`, `CORSOrigins`, `AllowRemote`, `Addr`) into diagnostics composition from server bootstrap/router options.
- Add backend tests near existing diagnostics handler/service/repository/config/privacy tests.

</code_context>

<specifics>
## Specific Ideas

The user wants Phase 5 focused on Claude Code and Codex first, with Gemini CLI removed from the immediate diagnostics contract despite existing roadmap language. This should be treated as a scope clarification that planning must reconcile before implementation.

</specifics>

<deferred>
## Deferred Ideas

- Gemini CLI hook/privacy diagnostics are deferred to future work unless roadmap and requirements are updated before planning.

</deferred>

---

*Phase: 5-Hook and Privacy Diagnostics*
*Context gathered: 2026-05-28T03:38:09Z*
