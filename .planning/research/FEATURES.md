# v1.1 Diagnostics Research — Features

## Product Framing

The Diagnostics UI should answer one operator question: "Can I trust this local hooker install today?"

It should not become a general analytics dashboard. Search, cost analytics, anomaly mining, and rich comparisons are better as later milestones.

## Table Stakes

### System Health

- App version, commit, build date.
- Health and readiness state.
- DB path and DB file size.
- Total event count and total session count.
- Last ingested event timestamp.
- Degraded event count or degraded percentage.

### Hook Connectivity

- One row per supported agent: Claude Code, Codex, Gemini CLI.
- Last seen timestamp per agent.
- Event count per agent.
- Normalizer version(s) seen per agent.
- Warning states:
  - no events seen
  - stale last event
  - degraded events exist
  - hook config not detectable or missing where detectable

### Privacy Posture

- Ignore file path.
- Ignore file status: missing, loaded, unreadable, or empty.
- Active ignore pattern count.
- CORS/remote-bind posture summary: loopback-only or remote enabled.
- Export sensitivity warning: exports contain prompts, diffs, paths, raw payloads, and tool output.

### UI Behavior

- Single Diagnostics page reachable from sidebar.
- Dense, operational layout: status summary, health checks, agent hook table, privacy panel.
- Manual refresh control.
- Loading, error, empty, warning, and healthy states.
- Mobile-safe layout without cards nested inside cards.

## Differentiators for Later

- DB maintenance actions: checkpoint, vacuum, prune.
- Hook config repair from UI.
- Open diagnostics bundle/export for support.
- Timeline of health events.
- Anomaly detection across failed tools or repeated degraded payloads.
- Compatibility matrix for agent CLI versions.

## Anti-Features for v1.1

- Full-text search.
- Cost analytics.
- Agent/session comparison.
- Public sharing or remote diagnostics.
- Automatic PII redaction.
- Mutating system configuration from the browser.

## Requirement Categories

Recommended requirement categories:

- **DIAG:** backend diagnostics endpoint and system-health facts.
- **HOOK:** supported-agent hook connectivity and last-seen status.
- **PRIV:** privacy posture display.
- **UI:** diagnostics page, navigation, states, refresh behavior.
- **TEST:** backend/frontend regression coverage.
