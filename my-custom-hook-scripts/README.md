# my-custom-hook-scripts

Standalone hook scripts for Claude Code and Codex. Zero dependencies — each file
is self-contained and can be copied anywhere. All scripts fail open: any internal
error exits 0 silently so a hook bug never blocks the agent. Scripts log to
`~/.argus/hook-scripts.log`.

Agent detection: `CLAUDECODE=1` env var → Claude Code (JSON hook output);
otherwise Codex (plain text / exit codes).

## Scripts

| Script | Hook event | Purpose |
| --- | --- | --- |
| `block-dangerous.js` | PreToolUse (`Bash`) | Deny dangerous shell commands (`rm -rf ~`, `curl \| sh`, force-push to main, `mkfs`, ...) with a reason the agent can act on. |
| `protect-secrets.js` | PreToolUse (`Read\|Edit\|Write\|Bash`) | Deny access to secret files (`.env`, `*.pem`, `~/.ssh/`, `~/.aws/`, ...). `.env.example/sample/template` are allowed. |
| `cost-warn.js` | SessionStart | Warn when token usage in the rolling 5h window (from the local argus DB) crosses a threshold. Silent otherwise. |
| `permission-request.js` | PermissionRequest | Native macOS approval dialog with an "Always" list. |
| `stop.js` | Stop | Local notification when the agent finishes. |
| `argus-activate-local.js` | SessionStart | Argus liveness banner with event/session counts. |

## Claude Code wiring (`~/.claude/settings.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node /Users/duytran/GitHub/argus/my-custom-hook-scripts/block-dangerous.js" }]
      },
      {
        "matcher": "Read|Edit|Write|Bash",
        "hooks": [{ "type": "command", "command": "node /Users/duytran/GitHub/argus/my-custom-hook-scripts/protect-secrets.js" }]
      }
    ],
    "SessionStart": [
      {
        "hooks": [{ "type": "command", "command": "node /Users/duytran/GitHub/argus/my-custom-hook-scripts/cost-warn.js" }]
      }
    ]
  }
}
```

## Configuration (all optional, in `~/.argus/`)

| File | Shape | Used by |
| --- | --- | --- |
| `dangerous-patterns.json` | `{ "extra": ["<regex>"], "allow": ["<regex>"] }` | `block-dangerous.js` |
| `protected-paths.json` | `{ "extra": ["<regex>"], "allow": ["<regex>"] }` | `protect-secrets.js` |
| `cost-warn.json` | `{ "threshold_tokens": 5000000, "warn_pct": 80 }` | `cost-warn.js` |

`allow` lists are checked before deny patterns — first match wins.

## Testing

Pipe a fixture into a script and check the output:

```bash
CLAUDECODE=1 node block-dangerous.js < fixtures/bash-dangerous.json   # deny JSON
CLAUDECODE=1 node block-dangerous.js < fixtures/bash-safe.json        # {}
CLAUDECODE=1 node protect-secrets.js < fixtures/read-env.json         # deny JSON
CLAUDECODE=1 node protect-secrets.js < fixtures/read-env-example.json # {}
CLAUDECODE=1 node protect-secrets.js < fixtures/read-safe.json        # {}
CLAUDECODE=1 node protect-secrets.js < fixtures/bash-cat-env.json     # deny JSON
CLAUDECODE=1 node cost-warn.js < fixtures/session-start.json          # silent unless over threshold
```

Codex behavior: drop `CLAUDECODE=1` — blockers exit 2 with the reason on stderr;
`cost-warn.js` prints plain text instead of JSON.

## Known limitations

- `cost-warn.js` approximates the Claude billing window with a rolling 5-hour
  lookback over session activity (`last_seen_at`); it does not track exact
  billing-block boundaries.
- Blockers are regex-based: they stop common accidents, not a determined
  adversary. Shell obfuscation can evade them.
