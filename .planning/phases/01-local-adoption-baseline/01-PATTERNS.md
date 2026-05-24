# Phase 1: Local Adoption Baseline - Pattern Map

**Mapped:** 2026-05-24
**Files analyzed:** 13 new/modified files
**Analogs found:** 11 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/internal/server/middleware.go` | middleware | request-response | self (extend) | exact — add alongside existing `cors` + `logging` funcs |
| `backend/internal/handler/health.go` | handler | request-response | `backend/internal/handler/version.go` | exact — same stateless handler factory pattern |
| `backend/internal/handler/version.go` | handler | request-response | self (extend) | exact — extend existing struct + import |
| `backend/internal/version/version.go` | config | — | self (extend) | exact — add two vars to existing package |
| `backend/internal/server/router.go` | config | — | self (extend) | exact — add route registrations + middleware wrap |
| `backend/internal/repository/sqlite/sqlite.go` | model | CRUD | self (extend) | exact — add `atomic.Bool` field + `Ready()` method |
| `backend/internal/repository/repository.go` | model | — | self (extend) | exact — add `Ready() bool` to interface |
| `backend/cmd/server/main.go` | config | — | self (extend) | exact — extend startup log + fatal checks |
| `frontend/src/app/Sidebar.tsx` | component | request-response | self (extend) | exact — replace inline version with `VersionBadge` |
| `frontend/src/features/version/useVersion.ts` | hook | request-response | `frontend/src/features/dashboard/hooks/useDashboardStats.ts` | role-match — same fetch-on-mount pattern |
| `frontend/src/features/version/VersionBadge.tsx` | component | request-response | `frontend/src/app/Sidebar.tsx` (inline span) | role-match — display component in sidebar footer |
| `scripts/hooker` | utility | — | self (extend) | exact — add subcommand bodies to existing case/esac shell |
| `.github/workflows/ci.yml` | config | — | none | no analog — new directory |
| `.github/workflows/release.yml` | config | — | none | no analog — new directory |
| `.goreleaser.yaml` | config | — | none | no analog — new file |
| `frontend/.npmrc` | config | — | none | no analog — new file |

---

## Pattern Assignments

### `backend/internal/server/middleware.go` (middleware, request-response) — EXTEND

**Analog:** self — `backend/internal/server/middleware.go` (lines 1–28)

**Existing middleware pattern** (lines 1–28):
```go
package server

import (
    "log"
    "net/http"
    "time"
)

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
    })
}

func cors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

**New `hostHeader` middleware to add** (append after line 28, add `"net"` to imports):
```go
// hostHeader rejects requests whose Host header is not an explicit localhost
// value. This prevents DNS rebinding attacks regardless of bind address.
func hostHeader(next http.Handler) http.Handler {
    allowed := map[string]bool{
        "localhost": true,
        "127.0.0.1": true,
        "[::1]":     true,
    }
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        host := r.Host
        if h, _, err := net.SplitHostPort(host); err == nil {
            host = h
        }
        if !allowed[host] {
            http.Error(w, "forbidden", http.StatusForbidden)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

**Wire order:** `hostHeader` wraps the outermost layer. In `router.go` change `cors(logging(mux))` to `hostHeader(cors(logging(mux)))`.

---

### `backend/internal/handler/health.go` (handler, request-response) — NEW

**Analog:** `backend/internal/handler/version.go` (lines 1–19) — exact same stateless handler-factory pattern

**Import pattern** (from version.go lines 1–8):
```go
package handler

import (
    "encoding/json"
    "net/http"

    "hooker/internal/version"
)
```

**Handler factory pattern** (from version.go lines 10–19):
```go
func Version() http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(struct {
            Version string `json:"version"`
        }{
            Version: version.Version,
        })
    })
}
```

**New health.go to create** — copy the factory pattern, no service dependency for `/healthz`, one bool dependency for `/readyz`:
```go
package handler

import "net/http"

func Healthz() http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
    })
}

func Readyz(ready func() bool) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if !ready() {
            http.Error(w, "not ready", http.StatusServiceUnavailable)
            return
        }
        w.WriteHeader(http.StatusOK)
    })
}
```

**Error handling pattern** (from events.go line 22): `http.Error(w, "msg", http.StatusCode); return`

---

### `backend/internal/handler/version.go` (handler, request-response) — EXTEND

**Analog:** self — current file is 19 lines

**Current file** (lines 1–19):
```go
package handler

import (
    "encoding/json"
    "net/http"

    "hooker/internal/version"
)

func Version() http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(struct {
            Version string `json:"version"`
        }{
            Version: version.Version,
        })
    })
}
```

**Extend the anonymous struct** to add `Commit` and `BuildDate` fields — no other changes:
```go
_ = json.NewEncoder(w).Encode(struct {
    Version   string `json:"version"`
    Commit    string `json:"commit"`
    BuildDate string `json:"buildDate"`
}{
    Version:   version.Version,
    Commit:    version.Commit,
    BuildDate: version.BuildDate,
})
```

---

### `backend/internal/version/version.go` (config) — EXTEND

**Analog:** self — current file is 3 lines

**Current file** (line 3):
```go
var Version = "0.0.0-dev"
```

**Extend to**:
```go
package version

var (
    Version   = "0.0.0-dev"
    Commit    = "none"
    BuildDate = "unknown"
)
```

**ldflags paths** (must match module path `hooker`):
```
-X hooker/internal/version.Version={{.Version}}
-X hooker/internal/version.Commit={{.Commit}}
-X hooker/internal/version.BuildDate={{.Date}}
```

---

### `backend/internal/server/router.go` (config) — EXTEND

**Analog:** self — current file lines 11–30

**Current route registration + middleware chain** (lines 11–30):
```go
func NewRouter(svc *service.EventService) http.Handler {
    mux := http.NewServeMux()

    mux.Handle("POST /api/hook", handler.Hook(svc))
    // ... existing routes ...
    mux.Handle("GET /api/version", handler.Version())
    // ...
    mux.Handle("GET /", ui.Handler())

    return cors(logging(mux))
}
```

**Add three routes and update signature** — `ready func() bool` parameter enables `/readyz` without importing the concrete sqlite type:
```go
func NewRouter(svc *service.EventService, ready func() bool) http.Handler {
    mux := http.NewServeMux()

    mux.Handle("GET /healthz", handler.Healthz())
    mux.Handle("GET /readyz", handler.Readyz(ready))
    // ... existing routes unchanged ...

    return hostHeader(cors(logging(mux)))
}
```

**Call site in `main.go`**: `server.NewRouter(svc, repo.Ready)`

---

### `backend/internal/repository/sqlite/sqlite.go` (model, CRUD) — EXTEND

**Analog:** self — `DB` struct (line 42–44), `New()` function (lines 52–73)

**Current DB struct** (lines 42–44):
```go
type DB struct {
    db *sql.DB
}
```

**Extend struct** — add `sync/atomic` import and `ready` field:
```go
import "sync/atomic"

type DB struct {
    db    *sql.DB
    ready atomic.Bool
}
```

**Current New() tail** (lines 68–72):
```go
d := &DB{db: db}
if err := d.migrate(); err != nil {
    return nil, err
}
return d, nil
```

**Extend tail** — set ready flag as the absolute last line after migrate succeeds:
```go
d := &DB{db: db}
if err := d.migrate(); err != nil {
    return nil, err
}
d.ready.Store(true)
return d, nil
```

**Add method** (append after `New`):
```go
func (d *DB) Ready() bool { return d.ready.Load() }
```

---

### `backend/internal/repository/repository.go` (model) — EXTEND

**Analog:** self — current interface (lines 7–23)

**Current interface** (lines 7–23):
```go
type EventRepository interface {
    Add(e domain.NormalizedEvent) error
    List(limit int) ([]domain.NormalizedEvent, error)
    // ... 18 methods total ...
}
```

**Add one method** to the interface:
```go
Ready() bool
```

Note: Adding `Ready()` to the interface means all mock implementations used in tests must also implement it. The mock in service tests will need a trivial `func (m *mockRepo) Ready() bool { return true }` added.

---

### `backend/cmd/server/main.go` (config) — EXTEND

**Analog:** self — current file lines 18–47

**Current startup sequence** (lines 18–47):
```go
func main() {
    cfg := config.Load()

    repo, err := sqlite.New(cfg.DBPath)
    if err != nil {
        log.Fatalf("open db: %v", err)
    }

    svc := service.New(repo)
    h := server.NewRouter(svc)

    log.Printf("hooker version -> %s", version.Version)
    log.Printf("hook endpoint  -> POST http://%s/api/hook", cfg.Addr)
    log.Printf("events SSE     -> GET  http://%s/api/events/stream", cfg.Addr)
    log.Printf("db             -> %s", cfg.DBPath)

    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer stop()

    srv := &http.Server{Addr: cfg.Addr, Handler: h}
    // ...
}
```

**Three changes:**
1. Pass `repo.Ready` to `NewRouter`: `h := server.NewRouter(svc, repo.Ready)`
2. Extend version log to include commit: `log.Printf("hooker version -> %s (%s)", version.Version, version.Commit)`
3. Add DB writability pre-check before `sqlite.New()`:
```go
// Pre-check DB path is writable before attempting open/migrate.
if cfg.DBPath != ":memory:" {
    f, err := os.OpenFile(cfg.DBPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
    if err != nil {
        log.Fatalf("db not writable at %s: %v", cfg.DBPath, err)
    }
    _ = f.Close()
}
```

**Error handling pattern** (from existing line 22): `log.Fatalf("context: %v", err)` — use for fatal startup errors only.

---

### `frontend/src/features/version/useVersion.ts` (hook, request-response) — NEW

**Analog:** `frontend/src/features/dashboard/hooks/useDashboardStats.ts`

**Import pattern** (useDashboardStats.ts lines 1–1):
```typescript
import { useCallback, useEffect, useMemo, useState } from 'react'
```

**Fetch-on-mount pattern** (useDashboardStats.ts lines 179–214, simplified for single fetch with no cache or reload):
```typescript
useEffect(() => {
    let mounted = true
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats')
            if (res.ok) {
                const data = await res.json()
                if (mounted) setSnapshot(data)
            }
        } catch (err) {
            console.error('Failed to fetch ...', err)
        }
    }
    fetchStats()
    return () => { mounted = false }
}, [])
```

**New useVersion.ts** — simpler than useDashboardStats (no cache, no reload, no params):
```typescript
import { useEffect, useState } from 'react'

type VersionInfo = { version: string; commit: string; buildDate: string } | null

export function useVersion(): VersionInfo {
  const [info, setInfo] = useState<VersionInfo>(null)
  useEffect(() => {
    let mounted = true
    fetch('/api/version')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (mounted && d) setInfo(d) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])
  return info
}
```

**Naming convention:** hook file is `useVersion.ts` (camelCase `use` prefix, named export) — matches `useDashboardStats.ts`, `useEvents.ts`.

---

### `frontend/src/features/version/VersionBadge.tsx` (component, request-response) — NEW

**Analog:** `frontend/src/app/Sidebar.tsx` — inline version span at lines 198–200

**Existing inline version display** (Sidebar.tsx lines 197–200):
```tsx
<span className="sidebar-label-motion sidebar-label-open whitespace-nowrap text-[0.66rem] font-medium text-[#555]">
  v{APP_VERSION}
</span>
```

**Approved UI spec** (from 01-UI-SPEC.md — font `0.66rem`, color `#444`, `font-medium`, hidden when sidebar collapsed):
```tsx
<span
  className="text-[0.66rem] font-medium text-[#444]"
  aria-label={`Application version: ${label}`}
>
  {label}
</span>
```

**Full component** — copy shadcn import convention from Sidebar.tsx, named export, no default export:
```tsx
import { useVersion } from './useVersion'

export function VersionBadge() {
  const info = useVersion()
  if (!info) return null
  const short = info.commit !== 'none' ? info.commit.slice(0, 7) : null
  const label = short ? `v${info.version} (${short})` : `v${info.version}`
  return (
    <span
      className="text-[0.66rem] font-medium text-[#444]"
      aria-label={`Application version: ${label}`}
    >
      {label}
    </span>
  )
}
```

**Placement in Sidebar.tsx:** Replace lines 197–200 (the `v{APP_VERSION}` span) with `<VersionBadge />`. Wrap in the same `collapsed`-guard so it hides when sidebar is collapsed. Remove `import { APP_VERSION } from '@/version'` at line 15. The `frontend/src/version.ts` file is deleted entirely.

---

### `scripts/hooker` (utility) — EXTEND

**Analog:** self — current file lines 1–100

**Existing structure to preserve** (lines 1–5, 18–26, 86–100):
```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

require_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'missing %s. %s\n' "$cmd" "$hint" >&2
    exit 1
  fi
}

case "${1:-}" in
  setup)   setup ;;
  doctor)  doctor ;;
  -h|--help|help|'')  usage ;;
  *)  usage >&2; exit 1 ;;
esac
```

**Idempotency check pattern** (D-01) — grep before mutating, backup before writing:
```bash
patch_claudecode_hooks() {
  local settings="$HOME/.claude/settings.json"
  if [ ! -f "$settings" ]; then
    printf '[skip] Claude Code settings.json not found at %s\n' "$settings"
    return
  fi
  if grep -q "8765/api/hook" "$settings"; then
    printf '[ok]   Claude Code hooks already configured\n'
    return
  fi
  cp "$settings" "${settings}.bak.pre-hooker"
  python3 - "$settings" <<'PYEOF'
import sys, json
path = sys.argv[1]
cmd = "curl -s --max-time 2 -X POST http://127.0.0.1:8765/api/hook -H 'Content-Type: application/json' -d @- || true"
with open(path) as f:
    d = json.load(f)
hooks = d.setdefault('hooks', {})
entry = {'hooks': [{'type': 'command', 'command': cmd}]}
for event in ['PreToolUse', 'PostToolUse', 'SessionStart', 'SessionEnd', 'Stop']:
    hooks.setdefault(event, []).append(entry)
with open(path, 'w') as f:
    json.dump(d, f, indent=2)
PYEOF
  printf '[ok]   Claude Code hooks configured\n'
}
```

**Doctor pass/fail pattern** (D-02 — report-only, never modify state):
```bash
PASS="[ok]  "
FAIL="[FAIL]"
WARN="[warn]"
doctor_errors=0

check_required() {
  local label="$1"
  local result="$2"   # "pass" or "fail"
  local hint="$3"
  if [ "$result" = "pass" ]; then
    printf '%s %s\n' "$PASS" "$label"
  else
    printf '%s %s\n  fix: %s\n' "$FAIL" "$label" "$hint"
    doctor_errors=$((doctor_errors + 1))
  fi
}

check_optional() {
  local label="$1"
  local result="$2"
  local hint="$3"
  if [ "$result" = "pass" ]; then
    printf '%s %s\n' "$PASS" "$label"
  else
    printf '%s %s\n  note: %s\n' "$WARN" "$label" "$hint"
  fi
}
```

**Remove from `doctor()`:** the `go test ./...` invocation at line 70–71 (violates D-02 — report-only).

**Add to `setup()`:** `go build -o "$ROOT/hooker" "$BACKEND/cmd/server"` after `go mod download` (D-04).

---

## Shared Patterns

### Go Handler Factory Pattern
**Source:** `backend/internal/handler/version.go` lines 10–19, `backend/internal/handler/events.go` lines 17–29
**Apply to:** `handler/health.go` (both `Healthz` and `Readyz`)

```go
func HandlerName(deps...) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // logic
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(responseStruct)
    })
}
```

Key: function returns `http.Handler`, closure captures deps, JSON encode error is intentionally discarded with `_ =`.

### Go Middleware Chain Pattern
**Source:** `backend/internal/server/middleware.go` lines 9–28, `backend/internal/server/router.go` line 29
**Apply to:** `hostHeader` in `middleware.go`, wire in `router.go`

```go
// middleware.go: func name(next http.Handler) http.Handler { return http.HandlerFunc(...) }
// router.go: return outermost(middle(innermost(mux)))
return hostHeader(cors(logging(mux)))
```

### Go Error Handling Pattern
**Source:** `backend/internal/handler/events.go` lines 21–24, `backend/cmd/server/main.go` lines 21–23
**Apply to:** All new handlers and startup additions

- Handler errors: `http.Error(w, "short msg", http.StatusCode); return`
- Fatal startup errors: `log.Fatalf("context: %v", err)`
- Recoverable errors: `log.Printf("[handler] key=%v", err)` (no abort)

### Frontend Fetch Hook Pattern
**Source:** `frontend/src/features/dashboard/hooks/useDashboardStats.ts` lines 179–214
**Apply to:** `useVersion.ts`

```typescript
// Pattern: mounted guard + try/catch + useState(null)
const [data, setData] = useState<T | null>(null)
useEffect(() => {
    let mounted = true
    fetch('/api/endpoint')
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (mounted && d) setData(d) })
        .catch(() => {})
    return () => { mounted = false }
}, [])
```

### Frontend Component Naming
**Source:** `frontend/src/app/Sidebar.tsx` line 61, `frontend/src/features/events/EventRow.tsx`
**Apply to:** `VersionBadge.tsx`

- PascalCase named export: `export function VersionBadge()`
- Props type co-located: `type VersionBadgeProps = { ... }` (if props needed)
- No default exports
- Import order: React → third-party → shadcn → lib/types → feature-local

### Bash Script Safety Pattern
**Source:** `scripts/hooker` lines 1–5
**Apply to:** All new shell functions in `scripts/hooker`

```bash
#!/usr/bin/env bash
set -euo pipefail
```

Always use `printf` not `echo` for output. Use `local` for all function variables. Never use `sed`/`awk` on JSON — use `python3 -c "import json; ..."`.

---

## No Analog Found

Files with no close match in the codebase — planner should use RESEARCH.md patterns directly:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.github/workflows/ci.yml` | config | — | No existing CI workflows; `.github/` directory does not exist |
| `.github/workflows/release.yml` | config | — | Same — no GitHub Actions in the repo |
| `.goreleaser.yaml` | config | — | No GoReleaser config exists; use Pattern 3 from RESEARCH.md verbatim |
| `frontend/.npmrc` | config | — | No `.npmrc` exists; single line: `engine-strict=true` |

---

## Metadata

**Analog search scope:** `backend/internal/server/`, `backend/internal/handler/`, `backend/internal/version/`, `backend/internal/config/`, `backend/internal/repository/`, `backend/cmd/server/`, `frontend/src/app/`, `frontend/src/features/dashboard/hooks/`, `scripts/`
**Files scanned:** 13 source files read directly
**Pattern extraction date:** 2026-05-24
