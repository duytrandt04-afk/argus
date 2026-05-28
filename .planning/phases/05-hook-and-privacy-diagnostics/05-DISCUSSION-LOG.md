# Phase 5: Hook and Privacy Diagnostics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28T03:38:09Z
**Phase:** 5-Hook and Privacy Diagnostics
**Areas discussed:** Agent telemetry rows, Hook config status, Status severity rules, Privacy/security posture fields

---

## Agent Telemetry Rows

| Option | Description | Selected |
|--------|-------------|----------|
| Events table | Use aggregate queries over stored `hook_events`; includes degraded rows. | |
| Sessions table | Use session-based activity for supported-agent count and last-seen semantics. | ✓ |
| Hybrid | Use sessions for last-seen and `hook_events` for counts. | |

**User's choice:** Sessions table.
**Notes:** Supported-agent `eventCount` and `lastSeen` should be session-based where possible.

| Option | Description | Selected |
|--------|-------------|----------|
| Separate unknown row | Keep degraded unknown payloads outside supported rows. | |
| Attach when inferable | Attach degraded events to supported agents when source/transcript allows inference. | ✓ |
| Global only | Report only one total degraded count. | |

**User's choice:** Attach when inferable.
**Notes:** Non-inferable degraded events stay in an unknown/internal summary.

| Option | Description | Selected |
|--------|-------------|----------|
| Latest observed | Show latest non-empty observed normalizer version. | ✓ |
| Distinct list | Show all observed versions. | |
| Static expected | Hardcode expected normalizer versions. | |

**User's choice:** Latest observed.
**Notes:** Return `null` when none exists.

| Option | Description | Selected |
|--------|-------------|----------|
| Always show all three | Show Claude Code, Codex, and Gemini CLI rows. | |
| Only configured agents | Hide missing/unconfigured agents. | |
| Only agents with activity | Hide agents with no data. | |
| Defer Gemini | Focus Phase 5 on Claude Code and Codex only. | ✓ |

**User's choice:** Always show all two; remove Gemini CLI for now.
**Notes:** This conflicts with current roadmap/requirements and is captured as a deferral that should be reconciled before planning.

---

## Hook Config Status

| Option | Description | Selected |
|--------|-------------|----------|
| Claude + Codex only | Detect only `~/.claude/settings.json` and `~/.codex/hooks.json`. | ✓ |
| Claude + Codex + Gemini unknown | Include Gemini row with config status always `unknown`. | |
| Claude + Codex + Gemini docs path | Also inspect `~/.gemini/settings.json`. | |

**User's choice:** Two-agent contract.
**Notes:** User briefly selected the Gemini-unknown option, then confirmed the two-agent contract.

| Option | Description | Selected |
|--------|-------------|----------|
| Missing | Config file exists but does not contain hooker endpoint. | ✓ |
| Unknown | Avoid false negatives if format changes. | |
| Misconfigured | Add a new explicit status. | |

**User's choice:** Missing.
**Notes:** Do not add a new `misconfigured` status.

| Option | Description | Selected |
|--------|-------------|----------|
| Unknown | Detection could not safely determine status; include non-sensitive reason. | ✓ |
| Missing | Treat unreadable/invalid files as absent. | |
| Configured | Avoid alarming users. | |

**User's choice:** Unknown.
**Notes:** Include only a non-sensitive reason code.

| Option | Description | Selected |
|--------|-------------|----------|
| Go detector | Implement backend detector with equivalent paths/endpoint matching. | ✓ |
| Shell parity only | Duplicate `scripts/hooker doctor` grep behavior. | |
| No config detection | Report `unknown` for all config status. | |

**User's choice:** Go detector.
**Notes:** Keep it structured so doctor can share it later if useful.

---

## Status Severity Rules

| Option | Description | Selected |
|--------|-------------|----------|
| No events warning | Config is okay, but capture has not been proven. | ✓ |
| Healthy | Avoid warning before first use. | |
| Unknown | Blur configured-but-unseen with detection failure. | |

**User's choice:** No events warning.
**Notes:** Applies when config is `configured` but no activity has been observed.

| Option | Description | Selected |
|--------|-------------|----------|
| No stale threshold in backend | Backend reports timestamps/counts; UI decides wording. | ✓ |
| 24 hours | Mark stale after one day. | |
| 7 days | Mark stale after one week. | |

**User's choice:** No stale threshold in backend.
**Notes:** Phase 6 UI may decide stale presentation later.

| Option | Description | Selected |
|--------|-------------|----------|
| Warning when any degraded | Any degraded count means adapter needs attention, app remains usable. | ✓ |
| Warning only above threshold | Needs an arbitrary threshold. | |
| Fatal/unhealthy | Too strong for intentionally non-fatal degraded ingestion. | |

**User's choice:** Warning when any degraded.
**Notes:** Degraded activity must not make diagnostics unhealthy/fatal.

| Option | Description | Selected |
|--------|-------------|----------|
| Per-agent only | Backend stays precise; UI can aggregate later. | ✓ |
| Overall summary too | Useful for UI but subjective. | |
| Counts only | Avoid statuses entirely. | |

**User's choice:** Per-agent only.
**Notes:** No overall agent connectivity rollup in backend.

---

## Privacy/security Posture Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Path + status + count | Expose ignore path, load status, and active pattern count; no raw patterns. | ✓ |
| Status + count only | More private but less useful. | |
| Path + raw patterns | Useful for debugging but violates privacy boundary. | |

**User's choice:** Path + status + count.
**Notes:** Never expose raw ignore patterns.

| Option | Description | Selected |
|--------|-------------|----------|
| Missing but OK | Missing default ignore file means zero active rules, not an error. | ✓ |
| Unknown | Conservative but less actionable. | |
| Warning | Could imply users must create an ignore file. | |

**User's choice:** Missing but OK.
**Notes:** Missing ignore file is safe/OK with zero active rules.

| Option | Description | Selected |
|--------|-------------|----------|
| Count + local/extra split | Avoid listing origins while showing whether extras exist. | ✓ |
| Full origin list | Transparent but may reveal local hostnames/dev domains. | |
| Remote-risk boolean only | More private but less useful for debugging. | |

**User's choice:** Count + local/extra split.
**Notes:** Do not expose full CORS origin list.

| Option | Description | Selected |
|--------|-------------|----------|
| Static canonical warning | Stable text covering prompts, diffs, file paths, tool outputs, raw payloads, and exports. | ✓ |
| Boolean flag only | UI owns wording. | |
| Structured sensitivity list | Flexible but more UI work. | |

**User's choice:** Static canonical warning.
**Notes:** Warning text should be stable and canonical.

---

## the agent's Discretion

None.

## Deferred Ideas

- Gemini CLI hook/privacy diagnostics are deferred to future work unless roadmap and requirements are updated before planning.
