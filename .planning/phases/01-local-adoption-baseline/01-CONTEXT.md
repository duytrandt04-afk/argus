# Phase 1: Local Adoption Baseline - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the gap between "it runs" and "a stranger can install in 10 minutes and trust it." Deliver: CI gates, DNS-rebinding security fix, install/doctor scripts, health/version endpoints, layered docs, and a release pipeline that produces versioned binaries with checksums. No new product features — this phase is entirely about trustworthiness and installability.

</domain>

<decisions>
## Implementation Decisions

### Setup Script (`./scripts/hooker`)

- **D-01:** Idempotent append for agent hook configs — check if hooker's entry already exists; skip if present, append if not. Safe to re-run without clobbering existing hook entries.
- **D-02:** Doctor is report-only — print clear pass/fail with actionable fix instructions. Never modify system state. No auto-fix prompts.
- **D-03:** `setup` patches Claude Code and Codex hook configs only. Gemini CLI deferred.
- **D-04:** `setup` builds the binary as part of setup (`go build`). User runs setup once and gets a working installation.

### Version Display (Frontend)

- **D-05:** Version appears in the sidebar footer — small muted text, low-profile, always visible.
- **D-06:** Display format: `v0.1.0 (abc1234)` — version + short commit hash. No build date in the UI.
- **D-07:** Frontend fetches version at runtime via `GET /api/version`. Not baked in at Vite build time. Always reflects the running binary.

### CI Workflow Organization

- **D-08:** Two workflows: `ci.yml` (every push/PR) + `release.yml` (on `v*` tags only).
- **D-09:** Ubuntu-latest only. GoReleaser cross-compiles darwin binaries from Linux — no macOS runner needed. Shell script platform gaps acceptable for solo maintainer.
- **D-10:** `govulncheck` runs with `continue-on-error: true` — advisory only until existing findings are triaged.
- **D-11:** Frontend build (`pnpm install && pnpm build`) is an explicit inline step in each workflow before `go build`. No Makefile indirection hiding the dependency order.

### GoReleaser / Release Pipeline

- **D-12:** Release binaries embed the pre-built frontend — single-file download, user just runs the binary. Matches existing `//go:embed dist/*` setup in `backend/internal/ui/ui.go`.
- **D-13:** Build targets: `linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`. No Windows native binary for now (WSL is primary Windows path).
- **D-14:** GitHub Releases only. No Homebrew tap yet — can be added when the project stabilizes.

### Claude's Discretion

- Script language for `./scripts/hooker`: pick bash/sh that maximizes compatibility across macOS and Linux without requiring additional runtime deps.
- Exact output formatting for `doctor` pass/fail report (symbols, colors, grouping of required vs optional checks).
- `golangci-lint` version pin strategy in CI.
- GoReleaser OSS v2 config specifics (archive format, checksum algorithm, changelog source).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full requirement IDs for Phase 1: INSTALL-01 through INSTALL-07, CI-01 through CI-06, DIAG-01 through DIAG-06, DATA-01, DATA-02, DATA-03, DATA-06, DATA-07, SEC-01, REL-01 through REL-05
- `.planning/ROADMAP.md` §Phase 1 — Success criteria and phase boundary

### Security Fix (Live Bug)
- `.planning/codebase/CONCERNS.md` §Security Considerations — Permissive CORS and unauthenticated ingestion context
- `backend/internal/server/middleware.go` — Current wildcard CORS; SEC-01 Host header middleware goes here
- `backend/internal/server/router.go` — Route registration; middleware wiring point

### Existing Code to Extend
- `backend/cmd/server/main.go` — Bootstrap entrypoint; startup validation (DIAG-05) and version log emit go here
- `backend/internal/config/config.go` — Runtime env vars; ADDR/DB_PATH; loopback default
- `backend/internal/ui/ui.go` — `//go:embed dist/*` already set up; GoReleaser just needs to build frontend first
- `frontend/src/app/Sidebar.tsx` — Version display (D-05) goes in footer of this component

### Stack Reference
- `.planning/codebase/STACK.md` — Go 1.25.0, pnpm 10.23.0, Node 18+, existing toolchain details
- `.planning/codebase/ARCHITECTURE.md` — Layer boundaries; where new middleware and endpoints attach

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/internal/server/middleware.go`: Add Host header validation middleware here alongside existing CORS middleware
- `backend/internal/config/config.go`: Extend for version/commit/buildDate constants injected via ldflags
- `frontend/src/app/Sidebar.tsx`: Footer slot exists; add version display component here
- `backend/internal/ui/ui.go`: `//go:embed dist/*` already wired; GoReleaser just needs frontend built before `go build`

### Established Patterns
- Config via env vars (`ADDR`, `DB_PATH`) — extend same pattern for any new config values
- Handler-per-concern in `backend/internal/handler/` — `/healthz`, `/readyz`, `/api/version` each get their own small handler or inline in a diagnostics handler file
- Frontend hooks fetch `/api/*` endpoints for data — version display follows same pattern (`useVersion` hook calling `/api/version`)

### Integration Points
- `backend/internal/server/router.go`: Register `/healthz`, `/readyz`, `/api/version` routes and add Host header middleware
- `backend/cmd/server/main.go`: Emit version on startup, add startup validation fatal errors
- `.github/workflows/`: New directory — no existing CI config to migrate

</code_context>

<specifics>
## Specific Ideas

- Setup script patches Claude Code and Codex hook configs. For Claude Code: `~/.claude/settings.json` hooks array. For Codex: check their hook config location.
- `doctor` output should clearly separate **required** failures (block usage) from **optional** warnings (hook config missing, non-loopback bind) — per DIAG-02 and DIAG-06.
- Binary naming convention for GoReleaser archives should be `hooker_VERSION_OS_ARCH` (standard GoReleaser default).
- SEC-01 is a live DNS rebinding bug — must ship in this phase before any public documentation goes out (noted in STATE.md).

</specifics>

<deferred>
## Deferred Ideas

- Homebrew tap — can add when project stabilizes (Phase 3 or later)
- Gemini CLI hook config patching — deferred from setup script scope
- Windows native binary — native Windows build deferred; WSL is primary path
- Makefile-based build orchestration — CI uses inline steps instead; Makefile enhancement not needed for this phase

</deferred>

---

*Phase: 1-Local Adoption Baseline*
*Context gathered: 2026-05-24*
