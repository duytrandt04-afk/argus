# Quickstart

Target: first successful local run in 5 to 10 minutes.

## 1. Install hooker

```bash
curl -fsSL https://raw.githubusercontent.com/duytrandt04-afk/hooker/main/install.sh | bash
```

Installs the hooker binary to `~/.local/bin/hooker`, wires the `SessionStart` hook in
`~/.claude/settings.json`, and creates `~/.local/bin/start-hooker.sh`.

Before you send the first hook event, know what hooker captures: prompts, diffs,
file paths, tool outputs, raw payloads, and exports are sensitive local data.
See [privacy controls](privacy.md) and the [local security model](security.md).

## 2. Start hooker

Open a new Claude Code or Codex session — hooker starts automatically via the
`SessionStart` hook. You will see:

```
SessionStart hook (completed)
  hook context: HOOKER live @ http://127.0.0.1:10804
```

Or start manually:
```bash
~/.local/bin/start-hooker.sh
```

Open **http://127.0.0.1:10804**.

## 3. Configure agent hooks

The setup script patches Claude Code and Codex hook configs automatically:

```bash
./scripts/hooker setup
```

Or configure manually using the hook guide for your agent:

- [Codex](hooks.md#codex)
- [Claude Code](hooks.md#claude-code)

## 4. Verify one event

1. Start Codex or Claude Code in any repo.
2. Send one prompt or run one tool command.
3. Confirm the event appears in the dashboard.

If no event appears, run:

```bash
curl -fsS http://127.0.0.1:10804/api/version
./scripts/hooker doctor
```
