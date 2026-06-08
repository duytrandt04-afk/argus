# hooker

Local-first monitoring dashboard for AI coding agent activity. Receives hook payloads from
Claude Code and Codex, normalizes them to a canonical event model, persists to
SQLite, and streams to a React SPA in real time.

## Quick start

```bash
curl -fsSL https://raw.githubusercontent.com/duytrandt04-afk/hooker/main/install.sh | bash
```

> **Requirements:** Node.js 18+, curl, tar — no Go or pnpm needed.
>
> The installer downloads a pre-built binary for your OS and arch, wires the Claude Code
> `SessionStart` hook, and places `hooker` in `~/.local/bin`.

Open **http://127.0.0.1:10804** after your next Claude Code or Codex session starts.

Then follow [docs/quickstart.md](docs/quickstart.md) to verify your first event.

## Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/duytrandt04-afk/hooker/main/uninstall.sh | bash
```

Stops the server, removes binaries and scripts, unwires hooks from `~/.claude/settings.json`, and optionally deletes your data.

## Documentation

- [docs/quickstart.md](docs/quickstart.md) - first-event walkthrough (under 10 minutes)
- [docs/install.md](docs/install.md) - full install reference, support matrix, data lifecycle
- [docs/privacy.md](docs/privacy.md) - capture categories, ignore controls, export implications
- [docs/security.md](docs/security.md) - local threat model and remote-sharing posture
- [docs/releases.md](docs/releases.md) - release runbook and conventional commit format

## Contributing

**Requirements:** Go 1.25+, Node.js 18+, pnpm 10+

```bash
git clone https://github.com/duytrandt04-afk/hooker
cd hooker
```

**Backend:**

```bash
cd backend
go test ./...            # run tests
golangci-lint run ./...  # lint
go run ./cmd/server      # start API on :10804
```

**Frontend (hot reload):**

```bash
cd frontend
pnpm install
pnpm dev                 # dev server on :5173, proxies /api → :10804
```

**Build + deploy locally** (rebuilds frontend, embeds into binary, restarts service):

```bash
make build-local
```

Version from `git describe` — e.g. `v0.1.1-11-g2024038`. `dirty` suffix = uncommitted changes.

See [CLAUDE.md](CLAUDE.md) for architecture, layer rules, and conventions.

## License

[LICENSE](LICENSE)
