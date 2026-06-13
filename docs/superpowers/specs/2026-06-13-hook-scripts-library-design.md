# Hook Scripts Library — Design

**Date:** 2026-06-13
**Status:** Approved (pending spec review)
**Topic:** A new "Scripts" page to browse the bundled hook-script collection and install/remove scripts into `~/.argus/hooks/`.

---

## 1. Problem & Goal

Argus already ships a public hook-script collection (`my-custom-hook-scripts/`, 12 scripts) and already scans `~/.argus/hooks/` for user-installed scripts (surfaced via `/api/diagnostics`, consumed by the simulator picker). But there is **no in-app way to get a script from the collection into `~/.argus/hooks/`** — the user must manually `cp` files by hand and know the paths.

**Goal:** A "Scripts" page where a user browses the bundled collection, reads each script's source, and installs it into `~/.argus/hooks/` with one click — then wires it (existing hooks-config) and tests it (existing simulator).

**Non-goals (YAGNI / deferred to v2):**
- Live-fetching scripts from GitHub or a remote registry.
- In-browser editing of installed scripts.
- Enabling/disabling or wiring scripts into `settings.json` from this page (that stays in hooks-config).
- Auto-update / "newer version available" notifications.

---

## 2. Locked Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| **Script source** | **Bundled in the binary** via `go:embed` | Local-first, offline, version-locked, no remote-code-exec trust problem. Matches "no cloud dependencies" + "no surprises". |
| **Manage scope** | **Install (new file only) + Delete + read-only View source** | Closes the core loop; wiring/config/testing already owned by hooks-config + simulator. |
| **Install conflict** | **Existence check** — if filename already in `~/.argus/hooks/`, badge **"Added"** and Install **disabled** (no reinstall, no overwrite) | Backend never overwrites → tightest write path; "no data loss". |
| **Catalog metadata** | Hand-maintained `catalog.json` manifest, embedded alongside scripts | Single source for name/purpose/event/runtime; no fragile parsing of script headers. |

---

## 3. Architecture

Follows existing layering: **handler → service → repository/domain** (this feature touches handler + domain + a new embed package; no repository/SQLite changes).

```
Browser
  GET  /api/scripts/catalog   ─┐
  POST /api/scripts/install    ├─ handler.Scripts(...)  →  scriptcatalog (embed)  +  ~/.argus/hooks/ (fs)
  DELETE /api/scripts/installed┘
```

### 3.1 Embed source & the sync step (the `..` wrinkle)

The Go module root is `backend/`. The canonical collection lives at repo-root `my-custom-hook-scripts/`, **outside** the module — `go:embed` cannot use `../`. Solution mirrors the existing `frontend/dist → backend/internal/ui/dist` Makefile copy:

- New package `backend/internal/scriptcatalog/`.
- Generated asset dir `backend/internal/scriptcatalog/files/` holds copies of `my-custom-hook-scripts/*.js` **plus** `catalog.json`.
- `make sync-scripts` (also wired as a prerequisite of the existing build target) copies `my-custom-hook-scripts/*.js` → `files/`.
- `embed.go` in the package does `//go:embed files/*` → exposes an `embed.FS`.
- **Drift guard:** a unit test in `scriptcatalog` fails if any embedded `.js` byte-differs from the repo-root source, or if `catalog.json` references a missing file / omits a present one. Keeps "single source = repo-root collection" honest.
- `files/` is committed (so `go build ./...` works standalone) and documented as **auto-generated — do not hand-edit**, same convention as `components/ui/*` and `ui/dist`.

### 3.2 Catalog manifest (`my-custom-hook-scripts/catalog.json`)

Hand-maintained, lives **with the source collection** (committed, edited by the maintainer when adding a script), copied into `files/` by the sync step. One entry per script:

```json
{
  "scripts": [
    {
      "filename": "block-dangerous.js",
      "title": "Block dangerous commands",
      "purpose": "Deny dangerous shell commands (rm -rf ~, curl | sh, force-push to main, mkfs) with a reason the agent can act on.",
      "event": "PreToolUse",
      "matcher": "Bash",
      "runtime": "node",
      "agents": ["claude-code", "codex"]
    }
  ]
}
```

`runtime` ∈ {`node`, `python3`, `sh`} — drives the "runtime missing" warning (cross-checked against the diagnostics runtime info the simulator already uses).

### 3.3 Domain types (`backend/internal/domain/`)

```go
// ScriptCatalogEntry is one bundled hook script's metadata + install state.
type ScriptCatalogEntry struct {
    Filename  string   `json:"filename"`
    Title     string   `json:"title"`
    Purpose   string   `json:"purpose"`
    Event     string   `json:"event"`
    Matcher   string   `json:"matcher,omitempty"`
    Runtime   string   `json:"runtime"`            // node | python3 | sh
    Agents    []string `json:"agents"`
    Source    string   `json:"source"`             // full script body (read-only display)
    Installed bool     `json:"installed"`          // file present in ~/.argus/hooks/
}
```

Frontend mirror in `frontend/src/types/` (new `scripts.ts`, added to the `types/` barrel) — JSON tags kept in sync, no transformation layer (per CLAUDE.md contract rule).

### 3.4 Endpoints

| Method + path | Handler | Behavior |
| --- | --- | --- |
| `GET /api/scripts/catalog` | `handler.ScriptsCatalog` | Parse embedded `catalog.json`, attach `Source` from embedded file, set `Installed` by checking `~/.argus/hooks/<filename>` existence. Returns `[]ScriptCatalogEntry`. |
| `POST /api/scripts/install` `{ "filename": "..." }` | `handler.ScriptsInstall` | Validate filename against catalog allowlist (must be an exact known entry — rejects anything not in the manifest, kills path traversal). If `~/.argus/hooks/<filename>` already exists → `409 Conflict` (UI keeps it disabled anyway). Else write embedded bytes to `~/.argus/hooks/<filename>`, `chmod 0755`. Returns updated entry. |
| `DELETE /api/scripts/installed?filename=...` | `handler.ScriptsDelete` | Same allowlist validation. `os.Remove(~/.argus/hooks/<filename>)`. Idempotent: missing file → success. |

**Security invariants (all three handlers):**
- Filename **must exactly match** a catalog entry's `filename` — never trust the request string as a path. This is the primary defense; it makes `../`, absolute paths, and symlinks structurally impossible.
- `~/.argus/hooks/` resolved from `ArgusDir` (already plumbed via `router.Options.ArgusDir` → `service.DiagnosticsOptions.ArgusDir`); create the dir (`0755`) if absent on install.
- Install writes **embedded bytes only** — never request body content.
- Install **never overwrites**: existing file → `409`, no write.

### 3.5 Router wiring (`backend/internal/server/router.go`)

```go
mux.Handle("GET /api/scripts/catalog",    handler.ScriptsCatalog(opts.ArgusDir))
mux.Handle("POST /api/scripts/install",   handler.ScriptsInstall(opts.ArgusDir))
mux.Handle("DELETE /api/scripts/installed", handler.ScriptsDelete(opts.ArgusDir))
```

---

## 4. Frontend

### 4.1 Route + nav
- New lazy route `scripts` in `App.tsx` → `features/scripts/ScriptsPage.tsx`.
- New `Sidebar.tsx` nav item ("Scripts", e.g. `ScrollText`/`FileCode` lucide icon), placed near "Hooks Config".

### 4.2 Feature module `frontend/src/features/scripts/`
```
ScriptsPage.tsx            # page shell: header + grid of cards
ScriptCard.tsx             # one script: title, purpose, event+matcher badges, runtime, state badge, actions
ScriptSourceDialog.tsx     # read-only source viewer (Popover/Dialog + <pre>)
hooks/useScriptCatalog.ts  # fetch catalog, install, delete, optimistic state refresh
__tests__/                 # co-located tests
```

### 4.3 Card states (existence-driven)
- **Available** — not in `~/.argus/hooks/`. Primary action: **Install**.
- **Added** — present. Install **disabled** ("Added" badge); secondary action: **Delete** (with confirm).
- **Runtime missing** — `runtime` binary absent (from diagnostics): show amber "needs `node`" hint; install still allowed (file copy is harmless; it just won't run until runtime present).

### 4.4 Components
Use shadcn primitives only (per rules): `Card`, `Badge`, `Button`, `Dialog`/`Popover` + `ScrollArea` for source, `Skeleton` for load, `Empty` for the (unlikely) empty catalog. No raw `<button>`/`<span>`.

### 4.5 Cross-links
- Card → "Wire it up" link/button routing to **Hooks Config** (pre-filtered to the script's event if cheap; otherwise plain nav).
- Card → "Test in simulator" link routing to the simulator tab.

---

## 5. Data Flow

**Install:**
```
ScriptCard [Install] → POST /api/scripts/install {filename}
  → handler validates filename ∈ catalog
  → write embedded bytes → ~/.argus/hooks/<filename>, chmod 0755
  → 200 {entry installed:true}
  → useScriptCatalog flips card to "Added"
```
The diagnostics FS scan + simulator picker pick up the new file on their next read automatically (no coupling needed).

**Delete:** symmetric → `os.Remove` → card back to "Available".

---

## 6. Error Handling (per CLAUDE.md backend rules)

- Every fail path returns `(_, error)` internally; handlers map to `http.Error(w, msg, status)`.
- `install` on existing file → `409 Conflict`, body `script already installed`.
- Unknown filename → `400 Bad Request`, body `unknown script`.
- FS write failure → `500`, logged `log.Printf("[scripts] install filename=%s err=%v", ...)`.
- Malformed `catalog.json` at startup is a build/test failure (drift guard), not a runtime branch.
- No panics, no sentinel errors — plain `errors.New`/`fmt.Errorf`.

---

## 7. Testing

**Backend (per CLAUDE.md patterns):**
- `scriptcatalog` package: drift guard test (embedded == repo-root source; manifest ↔ files consistent); manifest parse test.
- `handler` (black-box `package handler_test`, temp dir as `ArgusDir`):
  - catalog returns all entries with correct `Installed` flags.
  - install writes file with `0755`, returns `installed:true`.
  - install on existing file → `409`, original bytes untouched.
  - install unknown/`../`/absolute filename → `400`, nothing written outside dir.
  - delete removes file; delete-missing is idempotent success.
- Run gate: `go build ./...`, `go test ./...`, `golangci-lint run ./...`.

**Frontend (per CLAUDE.md patterns):**
- `useScriptCatalog`: fetch → state, install → optimistic flip, delete → flip back, error surface.
- `ScriptCard`: renders Available vs Added (install disabled when Added), runtime-missing hint.
- Run gate: `npx tsc --noEmit`, `npx vitest run`, `npx prettier --write`.

---

## 8. Files Touched

**New (backend):**
- `backend/internal/scriptcatalog/embed.go` (+ generated `files/`)
- `backend/internal/scriptcatalog/catalog.go` (parse + read source)
- `backend/internal/scriptcatalog/scriptcatalog_test.go`
- `backend/internal/handler/scripts.go`
- `backend/internal/handler/scripts_test.go`

**New (frontend):**
- `frontend/src/features/scripts/ScriptsPage.tsx`, `ScriptCard.tsx`, `ScriptSourceDialog.tsx`
- `frontend/src/features/scripts/hooks/useScriptCatalog.ts`
- `frontend/src/features/scripts/__tests__/*`
- `frontend/src/types/scripts.ts`

**New (source collection):**
- `my-custom-hook-scripts/catalog.json`

**Edited:**
- `backend/internal/domain/event.go` (or new `domain/scripts.go`) — `ScriptCatalogEntry`
- `backend/internal/server/router.go` — 3 routes
- `frontend/src/App.tsx` — lazy route
- `frontend/src/app/Sidebar.tsx` — nav item
- `frontend/src/types/index.ts` — barrel export
- `Makefile` — `sync-scripts` target + build prereq
- `CLAUDE.md` — document new surface + "auto-generated `scriptcatalog/files/`" convention
- `.gitignore` — (decision: commit `files/`, so no ignore; document as generated)

---

## 9. Open Risks / Notes

- **Manifest maintenance:** adding a future script means editing `catalog.json` + dropping the `.js`; the drift guard test enforces both. Acceptable solo-maintainer cost.
- **Runtime warning accuracy:** depends on diagnostics already detecting `node`/`python3`. If a runtime isn't probed today, warning is best-effort (non-blocking).
- **Scope creep guard:** wiring + enable/disable explicitly stay in hooks-config. This page is browse + install + delete only.
