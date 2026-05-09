# emruy

`emruy` is a premium, real-time agent monitoring dashboard designed for local development with **Claude Code** and **Codex**. It captures hook events (lifecycle, tool usage, prompts) and visualizes them in a streamlined interface, complete with diff rendering and token usage analytics.

## Features

- **Unified Monitoring**: Track Claude Code and Codex sessions side-by-side.
- **Diff Visualization**: Render code changes directly in the event stream.
- **Token Analytics**: Real-time token usage tooltips (input, output, and cache efficiency).
- **Usage Dashboard**: Administrative view for tracking aggregated OpenAI usage, costs, and model breakdowns.
- **State Persistence**: Remembers sidebar state, API keys, and time-range filters.

## Prerequisites

- **Go**: 1.25.0+
- **Node.js**: 18.x+
- **golangci-lint**: v2.x (for development)

## Agent Configuration

Ensure your agent configurations are set to forward hook events. You can configure these globally in your home directory or locally within a project's `.codex/` or `.claude/` folder.

### 1. Codex Configuration (`~/.codex/config.toml`)
Enable hooks in your config:
```toml
[features]
codex_hooks = true
```

### 2. Hook Endpoints
Configure your agents to POST to `http://127.0.0.1:8765/api/hook`.

**Codex (`~/.codex/hooks.json`)**:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-",
            "timeout": 5
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-",
            "timeout": 5
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Claude Code (`~/.claude/settings.json`)**:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"/Users/duytran/.claude/hooks/caveman-activate.js\"",
            "timeout": 5,
            "statusMessage": "Loading caveman mode..."
          }
        ]
      }
    ],
    "Setup": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"/Users/duytran/.claude/hooks/caveman-mode-tracker.js\"",
            "timeout": 5,
            "statusMessage": "Tracking caveman mode..."
          }
        ]
      }
    ],
    "UserPromptExpansion": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "rtk hook claude"
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PermissionDenied": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PostToolBatch": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "StopFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "TaskCreated": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "FileChanged": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "ConfigChange": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "InstructionsLoaded": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "CwdChanged": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "WorktreeCreate": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "WorktreeRemove": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "Elicitation": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ],
    "ElicitationResult": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @-"
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "bash \"/Users/duytran/.claude/hooks/caveman-statusline.sh\""
  },
  "enabledPlugins": {
    "caveman@caveman": true,
    "frontend-design@claude-plugins-official": true,
    "modern-go-guidelines@goland-claude-marketplace": true
  },
  "extraKnownMarketplaces": {
    "caveman": {
      "source": {
        "source": "github",
        "repo": "JuliusBrussee/caveman"
      }
    },
    "goland-claude-marketplace": {
      "source": {
        "source": "github",
        "repo": "JetBrains/go-modern-guidelines"
      }
    }
  }
}
```

## Getting Started & Development

**1. Backend (Go)**
```bash
cd backend
go run main.go

# Development commands:
# go test ./...
# go vet ./...
# golangci-lint run ./...
```

If your shell or sandbox blocks writes to `~/.cache`, run backend checks with workspace-local caches instead:
```bash
cd backend
mkdir -p .cache/go-build .cache/golangci-lint
GOCACHE="$PWD/.cache/go-build" go test ./...
GOCACHE="$PWD/.cache/go-build" go vet ./...
GOCACHE="$PWD/.cache/go-build" GOLANGCI_LINT_CACHE="$PWD/.cache/golangci-lint" golangci-lint run ./...
```

**2. Frontend (React/Vite)**
```bash
cd frontend
pnpm install
pnpm run dev
```

**3. Dashboard**
Open [http://localhost:5173](http://localhost:5173) in your browser.
