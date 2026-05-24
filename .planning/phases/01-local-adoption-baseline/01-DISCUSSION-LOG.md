# Phase 1: Local Adoption Baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 1-Local Adoption Baseline
**Areas discussed:** Setup script behavior, Version display in frontend, CI workflow organization, GoReleaser release scope

---

## Setup Script Behavior

### Q1: How should `setup` handle existing hook configs?

| Option | Description | Selected |
|--------|-------------|----------|
| Idempotent append | Check if entry exists; skip if present, append if not. Safe to re-run. | ✓ |
| Always overwrite | Replace config section with fresh entry. Destructive. | |
| Bail and print instructions | Don't touch existing config; print manual instructions. | |

**User's choice:** Idempotent append

---

### Q2: When `doctor` finds a required check failing, should it auto-fix?

| Option | Description | Selected |
|--------|-------------|----------|
| Report only | Print pass/fail with actionable instructions. Never touch system state. | ✓ |
| Offer to fix inline | Prompt y/n for fixable issues. | |
| You decide | Use best judgment. | |

**User's choice:** Report only

---

### Q3: Which agents should `setup` patch configs for?

| Option | Description | Selected |
|--------|-------------|----------|
| All 3: Claude Code + Codex + Gemini CLI | All supported agents. | |
| Claude Code only | Most common; others added later. | |
| Claude Code and Codex only | — | ✓ |
| Interactive — ask which agents | Prompt during setup. | |

**User's choice:** Claude Code and Codex only (Gemini CLI deferred)

---

### Q4: Should `setup` build the binary?

| Option | Description | Selected |
|--------|-------------|----------|
| Build binary as part of setup | `go build` included in setup flow. | ✓ |
| Configure only, document build separately | Setup patches configs; quickstart covers build. | |
| You decide | — | |

**User's choice:** Build binary as part of setup

---

## Version Display in Frontend

### Q1: Where in the UI should version appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar footer | Small muted text, always visible. | ✓ |
| Dashboard page | Version badge/card on dashboard. | |
| Header/top bar | Small text in top navigation. | |

**User's choice:** Sidebar footer

---

### Q2: What version info should be shown?

| Option | Description | Selected |
|--------|-------------|----------|
| Version + short commit hash | e.g., `v0.1.0 (abc1234)` | ✓ |
| Version only | e.g., `v0.1.0` | |
| Version + commit + build date | e.g., `v0.1.0 (abc1234, 2026-05-24)` | |

**User's choice:** Version + short commit hash

---

### Q3: How does frontend get version?

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime — call /api/version on load | Always reflects running binary. | ✓ |
| Build-time — bake into Vite via env vars | Version reflects build time, not runtime. | |
| You decide | — | |

**User's choice:** Runtime API call

---

## CI Workflow Organization

### Q1: Workflow structure?

| Option | Description | Selected |
|--------|-------------|----------|
| Two workflows: ci.yml + release.yml | Clean separation of push/PR vs tag triggers. | ✓ |
| Single workflow with jobs | Everything in one file, release job gated on tags. | |
| Three workflows: backend + frontend + release | Maximum independence. | |

**User's choice:** Two workflows

---

### Q2: What OS for CI?

| Option | Description | Selected |
|--------|-------------|----------|
| ubuntu-latest only | Fast, cheap; GoReleaser cross-compiles darwin from Linux. | ✓ |
| ubuntu + macos matrix | Catches macOS shell script issues. 2x slower. | |
| ubuntu + macos + windows matrix | Full coverage. 3x slower. | |

**User's choice:** ubuntu-latest only
**Notes:** User asked whether ubuntu-only CI means hooker won't run on macOS. Clarified: CI OS ≠ build targets. GoReleaser cross-compiles darwin/amd64 + darwin/arm64 from Linux. Hooker integrates as a hook receiver sidecar, not an in-process plugin — setup script patches Claude Code/Codex config to POST to localhost:8765.

---

### Q3: govulncheck — blocking or advisory?

| Option | Description | Selected |
|--------|-------------|----------|
| Advisory only (continue-on-error: true) | Triage existing findings first, then flip to blocking. | ✓ |
| Blocking from day one | Zero-tolerance, but may block PRs on unknown existing findings. | |

**User's choice:** Advisory only

---

### Q4: Frontend build order in CI?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline steps in each workflow | Explicit `pnpm install && pnpm build` before `go build`. | ✓ |
| Makefile target handles ordering | CI calls `make build`. Hides dependency order. | |
| You decide | — | |

**User's choice:** Inline steps

---

## GoReleaser Release Scope

### Q1: Embed frontend in release binaries?

| Option | Description | Selected |
|--------|-------------|----------|
| Embed pre-built frontend in binary | Single-file download. Matches existing embed setup. | ✓ |
| Source-only — user builds from source | User must run `pnpm build` separately. | |

**User's choice:** Embed pre-built frontend

---

### Q2: Which platforms?

| Option | Description | Selected |
|--------|-------------|----------|
| linux + darwin × amd64 + arm64 | 4 targets. Covers primary support matrix. | ✓ |
| linux + darwin + windows × amd64 + arm64 | 6 targets including Windows native. | |
| linux/amd64 + darwin/arm64 only | Minimal 2 targets. | |

**User's choice:** linux + darwin × amd64 + arm64

---

### Q3: Package manager distribution?

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Releases only | Binaries + checksums.txt. No extra infra. | ✓ |
| GitHub Releases + Homebrew tap | More polish, second repo to maintain. | |
| You decide | — | |

**User's choice:** GitHub Releases only

---

## Claude's Discretion

- Script language for `./scripts/hooker` (bash vs sh for cross-platform compatibility)
- Exact output formatting for `doctor` (symbols, colors, required vs optional grouping)
- `golangci-lint` version pin strategy in CI
- GoReleaser OSS v2 config specifics (archive format, checksum algorithm, changelog source)

## Deferred Ideas

- Homebrew tap — add when project stabilizes
- Gemini CLI hook config patching in setup script
- Windows native binary (native Windows build deferred; WSL primary)
- Makefile-based build orchestration
