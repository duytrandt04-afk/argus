# Phase 6: Diagnostics UI - Research

**Researched:** 2026-05-28
**Domain:** React SPA feature — route, fetch hook, page layout, state handling, frontend tests
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01** — `/diagnostics` uses a status-first layout. First viewport answers "is hooker healthy?" plus warning counts.
**D-02** — Main status derives from health/readiness plus a separate warning count. Worst warning does not auto-override main health status.
**D-03** — Top summary row: four compact tiles — readiness, total events/latest event, agent warnings, privacy/security warnings.
**D-04** — Below summary row: two-column desktop layout (agent table left, system facts + privacy right). Stack on mobile.
**D-05** — Inline badges plus summary counts, not section banners or row color alone.
**D-06** — Top-level warning count includes: degraded agents, missing configured hooks, remote enabled, extra CORS origins, DB not ready.
**D-07** — Agent `no events` is a soft notice with muted inline badge text ("No events yet"); not counted as a warning.
**D-08** — Hook config `unknown` is caution, not failure. Amber badge + short reason; counted only when paired with no activity or degraded activity.
**D-09** — Fetch failure: keep page shell, show compact retry panel naming the failed endpoint.
**D-10** — `health.ready=false`: still render all available diagnostics. Top health tile says "Not ready" + reason.
**D-11** — Zero events + all agents `no events`: show soft setup hint ("No activity observed yet"), not a warning.
**D-12** — Ignore file `missing_ok`: explain no ignore file configured and zero rules active; do not warn.
**D-13** — Manual refresh only. No polling or focus-refresh in this phase.
**D-14** — Manual refresh keeps current data visible; shows quiet spinner/disabled state on refresh icon.
**D-15** — "Updated ..." timestamp near the refresh button.
**D-16** — Initial page load renders skeleton sections, not a blank page or centered spinner.
**D-17** — Privacy/security posture reads as a calm checklist.
**D-18** — Export sensitivity warning always visible as a compact persistent note below privacy/security facts.
**D-19** — Remote bind and extra CORS origins receive warning badges.
**D-20** — File paths: monospace, visually truncated, copy affordance or title/full-value access.

### Claude's Discretion

No areas delegated to the agent. All gray areas were decided explicitly in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Diagnostics page reachable from sidebar at `/diagnostics` | Route added to App.tsx lazy pattern; NAV_ITEMS entry in Sidebar.tsx |
| UI-02 | Compact operator layout: status summary, system facts, agent connectivity table, privacy panel | Four-tile summary row + two-column body mirrors Dashboard shell pattern |
| UI-03 | Page supports loading, error, empty, warning, healthy, and manual refresh states | useDiagnostics hook with loading/refreshing/error shape; skeleton-first pattern from Dashboard |
| UI-04 | Responsive and consistent with existing app shell | max-w-[1200px] container, grid-cols responsive breakpoints matching Dashboard |
| TEST-02 | Frontend tests cover healthy, warning, loading, error, and empty states | Vitest + Testing Library; vi.stubGlobal('fetch') pattern established across project |
| TEST-03 | Route/sidebar tests cover Diagnostics navigation | MemoryRouter route test + Sidebar.desktop.test.tsx augmentation |

</phase_requirements>

---

## Summary

Phase 6 is a pure frontend feature — no backend work required. The backend diagnostics contract was completed and verified in Phases 4 and 5; this phase consumes `GET /api/diagnostics` and builds the React UI around it.

The implementation is straightforward extension of established project patterns. The Dashboard page (`frontend/src/pages/Dashboard.tsx`) provides the exact shell, header, refresh button, and skeleton pattern to mirror. The `useDashboardStats` hook provides the exact fetch/reload/loading/refreshing shape to replicate in `useDiagnostics`. The Sidebar's `NAV_ITEMS` array accepts a new entry with zero structural changes. All required shadcn components (`Card`, `Badge`, `Table`, `Skeleton`, `Tooltip`, `Alert`, `Separator`, `Button`) are already installed in `frontend/src/components/ui/`.

The test infrastructure is established: Vitest 4.1.5, Testing Library 16.3.2, `vi.stubGlobal('fetch')` as the universal mock pattern, `MemoryRouter` wrapping, and `afterEach(cleanup)` in the global setup. The existing `Sidebar.desktop.test.tsx` file is the correct target for sidebar navigation assertions.

**Primary recommendation:** Build `frontend/src/features/diagnostics/` as a self-contained feature directory (types.ts, hooks/useDiagnostics.ts, DiagnosticsPage.tsx). Wire into App.tsx and Sidebar.tsx. Tests go in `frontend/tests/features/diagnostics/`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `/api/diagnostics` data fetch | Frontend (hook) | — | Backend endpoint complete from Phase 5; hook owns fetch lifecycle |
| Route registration | Frontend (App.tsx) | — | Client-side SPA routing via React Router; no backend route needed |
| Sidebar navigation | Frontend (Sidebar.tsx) | — | NAV_ITEMS array centralized in Sidebar component |
| Page layout + state rendering | Frontend (DiagnosticsPage.tsx) | — | All display logic is frontend; no server-side rendering |
| Warning count computation | Frontend (DiagnosticsPage.tsx) | — | Derived from fetched data per D-06 logic; no backend aggregation needed |
| Loading/skeleton state | Frontend (DiagnosticsPage.tsx) | — | Pattern mirrors DashboardSkeleton; no backend involvement |
| Relative timestamp formatting | Frontend (lib/format.ts or inline) | — | date-fns `formatDistanceToNow` available and tested |

---

## Standard Stack

### Core (all already installed — no new dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.5 | UI rendering | Project runtime [VERIFIED: package.json] |
| React Router DOM | 7.14.2 | Lazy route registration | Existing lazy pattern in App.tsx [VERIFIED: package.json] |
| date-fns | ^4.1.0 | `formatDistanceToNow` for "Updated ... ago" display | Already imported in dashboard features; confirmed functional in v4 [VERIFIED: runtime test] |
| lucide-react | present | `Stethoscope`, `RefreshCw`, `Copy`, `Activity`, `Database`, `Zap`, `Shield`, `AlertTriangle`, `CheckCircle2`, `XCircle` icons | Project icon library per CLAUDE.md |
| shadcn components | present | Card, Badge, Button, Skeleton, Table, Tooltip, Alert, Separator | All confirmed present in `frontend/src/components/ui/` [VERIFIED: filesystem] |
| Vitest | ^4.1.5 | Frontend tests | Project test framework [VERIFIED: package.json] |
| Testing Library | ^16.3.2 | Component/hook tests | Established per CLAUDE.md [VERIFIED: package.json] |

**No new packages to install.** [VERIFIED: all dependencies present]

### New Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/features/diagnostics/types.ts` | Frontend type mirrors for backend `domain.Diagnostics` JSON shape |
| `frontend/src/features/diagnostics/hooks/useDiagnostics.ts` | Fetch hook: loading/refreshing/error/data/lastUpdatedAt/reload |
| `frontend/src/features/diagnostics/DiagnosticsPage.tsx` | Page component: all layout sections + state handling |
| `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx` | Page state tests (loading, error, healthy, warning, empty, not-ready, refresh) |
| `frontend/tests/features/diagnostics/DiagnosticsRoute.test.tsx` | Route reachability test at `/diagnostics` |

### Existing Files to Modify

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Add `DiagnosticsPage` lazy import + `<Route path="diagnostics">` inside Layout |
| `frontend/src/app/Sidebar.tsx` | Add `Stethoscope` import + NAV_ITEMS entry for `/diagnostics` |
| `frontend/tests/app/Sidebar.desktop.test.tsx` | Add assertion that "Diagnostics" nav item is present |

---

## Architecture Patterns

### System Architecture Diagram

```
Browser GET /diagnostics
        │
        ▼
  DiagnosticsPage
  (lazy via Suspense)
        │
        ├── [loading=true] ──► Skeleton sections (4 tiles + table + 2 panels)
        │
        ├── [error!=null] ───► Retry panel (Card + "Could not reach /api/diagnostics" + Button)
        │
        └── [data!=null] ────► Page layout
                                ├── Header row (h1 + "Updated N ago" + RefreshCw)
                                ├── Summary tile row (4×Card: readiness, events, agent warnings, privacy warnings)
                                └── Two-column body
                                    ├── Left: Agent Connectivity Table (Table with Badge per agent)
                                    └── Right (stacked):
                                        ├── System Facts Card (version, DB path, DB size, totals)
                                        └── Privacy & Security Card (ignore file, rules, bind, CORS, Alert export warning)

useDiagnostics hook
        │
        ├── fetch('/api/diagnostics') on mount + on reload()
        ├── loading: true (first fetch, no data)
        ├── refreshing: true (reload(), data exists)
        ├── error: string | null
        ├── lastUpdatedAt: Date | null
        └── reload: () => void (increments reloadKey)
```

### Recommended Project Structure

```
frontend/src/features/diagnostics/
├── types.ts                    # DiagnosticsXxx interfaces (mirrors domain/diagnostics.go)
├── DiagnosticsPage.tsx         # Page component — all sections and state logic
└── hooks/
    └── useDiagnostics.ts       # Fetch/reload hook

frontend/tests/features/diagnostics/
├── DiagnosticsPage.test.tsx    # State rendering tests (7 scenarios)
└── DiagnosticsRoute.test.tsx   # Route test at /diagnostics
```

### Pattern 1: Lazy Route Registration (mirrors existing App.tsx pattern)

**What:** Dynamically import page components inside React's `lazy()` + `Suspense fallback={null}`.
**When to use:** Every page-level component in this project.

```tsx
// Source: frontend/src/App.tsx — established pattern
const DiagnosticsPage = lazy(() =>
  import('./features/diagnostics/DiagnosticsPage').then((m) => ({ default: m.DiagnosticsPage }))
)

// Inside <Route element={<Layout />}>:
<Route
  path="diagnostics"
  element={
    <Suspense fallback={null}>
      <DiagnosticsPage />
    </Suspense>
  }
/>
```

Note: `DiagnosticsPage` is a named export (not default), following project convention. The `.then((m) => ({ default: m.DiagnosticsPage }))` adapter is required. [VERIFIED: all existing lazy routes use this pattern]

### Pattern 2: Fetch/Reload Hook Shape (mirrors useDashboardStats)

**What:** Custom hook with `loading` / `refreshing` distinction, `reloadKey` increment trigger, and `mounted` guard for cleanup.
**When to use:** Any page-level data fetch in this project.

```ts
// Source: frontend/src/features/dashboard/hooks/useDashboardStats.ts — established pattern
export function useDiagnostics() {
  const [reloadKey, setReloadKey] = useState(0)
  const [data, setData] = useState<Diagnostics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let mounted = true
    const isRefresh = reloadKey > 0 && data !== null
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    fetch('/api/diagnostics')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!mounted) return
        setData(json as Diagnostics)
        setLastUpdatedAt(new Date())
      })
      .catch(() => {
        if (!mounted) return
        setError('Could not reach /api/diagnostics')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => { mounted = false }
  }, [reloadKey])

  return { data, loading, refreshing, error, lastUpdatedAt, reload }
}
```

Key difference from `useDashboardStats`: no caching (diagnostics is a live snapshot per D-13), and `error` state is surfaced (dashboard suppresses errors silently). [VERIFIED: useDashboardStats source]

### Pattern 3: NAV_ITEMS Extension (Sidebar.tsx)

**What:** Add a new entry to the `NAV_ITEMS` constant array. No structural changes to `renderNavButton` or tooltip logic required.
**When to use:** Adding any new top-level route to sidebar navigation.

```ts
// Source: frontend/src/app/Sidebar.tsx — NAV_ITEMS array lines 37-59
{
  to: '/diagnostics',
  label: 'Diagnostics',
  ariaLabel: 'System Diagnostics',
  icon: Stethoscope,
  end: false,
}
```

Add after the Projects entry (last item). Import `Stethoscope` from `lucide-react`. [VERIFIED: Sidebar.tsx NAV_ITEMS structure]

### Pattern 4: Skeleton-First Loading

**What:** Render skeleton placeholders for every section; no blank page, no centered spinner (D-16).
**When to use:** All loading states in this phase.

```tsx
// Source: Dashboard.tsx loading pattern + UI-SPEC skeleton contract
{loading && (
  <div aria-busy="true">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[80px] rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <Skeleton className="h-[160px]" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
)}
```

### Pattern 5: Badge with Custom Color Override

**What:** Use shadcn `Badge` with `className` override for semantic status colors — do not use `variant="destructive"` directly.
**When to use:** All status badges in the agent table and privacy panel.

```tsx
// Source: UI-SPEC Badge variant pattern
// Degraded / missing (red):
<Badge className="border-[var(--destructive)] text-[var(--destructive)] bg-[rgba(255,95,86,0.1)]">
  Degraded
</Badge>

// Unknown / stale (amber):
<Badge className="border-[var(--cwd)] text-[var(--cwd)] bg-transparent">
  Unknown
</Badge>

// Configured (green):
<Badge className="border-[var(--worktree)] text-[var(--worktree)] bg-transparent">
  Configured
</Badge>

// No events (muted text only, no badge color):
<span className="text-[12px] text-muted-foreground">No events yet</span>
```

### Pattern 6: Monospace Path with Copy Affordance (D-20)

**What:** Plain `<span>` with `font-mono` + `title` + `truncate`, adjacent plain `<button>` (not shadcn Button) for copy.
**When to use:** DB path and ignore file path display.

```tsx
// Source: UI-SPEC Monospace Path Contract
<span
  className="font-mono text-[12px] text-foreground truncate max-w-[220px] inline-block align-bottom"
  title={fullPath}
>
  {fullPath}
</span>
<button
  onClick={() => navigator.clipboard.writeText(fullPath)}
  className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
  aria-label="Copy DB path"
>
  <Copy className="size-3 inline" />
</button>
```

The `title` attribute provides full-value access without tooltip nesting complexity. [VERIFIED: UI-SPEC]

### Pattern 7: Warning Count Computation

**What:** Derive tile 3 and tile 4 warning counts from `data` in the component, not in the hook.
**When to use:** Summary tile rendering only.

```ts
// Source: UI-SPEC Warning Count Computation section
const agentWarningCount = data.agents.filter(
  (a) =>
    a.status === 'degraded' ||
    a.hookConfigStatus === 'missing' ||
    (a.hookConfigStatus === 'unknown' && a.eventCount === 0)
).length

const privacyWarningCount =
  (data.security.remoteBind.allowRemote ? 1 : 0) +
  (data.security.cors.extraOrigins > 0 ? 1 : 0) +
  (data.privacy.ignoreFile.status === 'error' ? 1 : 0)
```

### Anti-Patterns to Avoid

- **Polling or auto-refresh:** D-13 is explicit — manual only. No `setInterval`, no `window.addEventListener('focus')`.
- **Re-rendering skeletons during refresh:** D-14 — skeleton only on initial load (`loading === true`). During `refreshing`, keep current data visible.
- **Using `variant="destructive"` on Badge:** UI-SPEC requires `className` override with CSS var. Using the variant produces wrong visual weight for inline table badges.
- **Barrel file in features/diagnostics/:** CLAUDE.md prohibits barrel `index.ts` in feature directories. Import directly from the specific file.
- **Default export for DiagnosticsPage:** CLAUDE.md requires named exports for components. The lazy adapter pattern handles this.
- **Raw `<button>` for the refresh control:** The refresh button is a shadcn `Button` (variant="outline", size="icon-sm"). Only the copy affordance uses a plain `<button>`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time display | Custom time-ago formatter | `date-fns formatDistanceToNow` | Already in project dependencies; handles edge cases (DST, locale) |
| Status badge styling | Custom CSS classes | shadcn `Badge` + `className` override | Consistent with project badge patterns elsewhere |
| Skeleton loading | `opacity: 0` or delayed render | shadcn `Skeleton` | Already installed; matches existing Dashboard skeleton visual |
| Path truncation tooltip | Custom popover | CSS `truncate` + `title` attribute | Simpler, no tooltip nesting; UI-SPEC explicitly chose this |
| Number formatting | Custom formatter | `toLocaleString()` | Built-in; sufficient for event counts |

---

## Frontend Types Contract — Verified Against Backend

The UI-SPEC `types.ts` contract was cross-checked against `backend/internal/domain/diagnostics.go`.

**Type mismatches to be aware of:**

| Field | Backend Go type | Frontend type in UI-SPEC | Notes |
|-------|----------------|--------------------------|-------|
| `DiagnosticsStorage.DBSizeBytes` | `*int64` | `number \| null` | `*int64` = nullable int64; maps correctly to `number \| null` |
| `DiagnosticsStorage.LatestEventAt` | `*string` | `string \| null` | Pointer = nullable; maps correctly |
| `DiagnosticsAgent.LastSeenAt` | `*string` | `string \| null` | Pointer = nullable; maps correctly |
| `DiagnosticsAgent.NormalizerVersion` | `*string` | `string \| null` | Pointer = nullable; maps correctly |
| `DiagnosticsHealth.Reason` | `string` with `omitempty` | `string?` (optional) | `omitempty` on string means field absent when empty; TypeScript optional `?` is correct |
| `DiagnosticsStorage.DBSizeReason` | `string` with `omitempty` | `string?` (optional) | Same as above |
| `DiagnosticsAgent.HookConfigReason` | `string` with `omitempty` | `string?` (optional) | Same as above |
| `DiagnosticsSecurity.CORS` | Go field `CORS` | JSON tag `cors` | JSON tag is lowercase `cors`; frontend field name should be `cors` |

[VERIFIED: backend/internal/domain/diagnostics.go cross-referenced with UI-SPEC types.ts]

**One correction needed in types.ts from UI-SPEC:** The UI-SPEC writes `security: DiagnosticsSecurity` with a nested `cors` field. The Go JSON tag for `DiagnosticsSecurity.CORS` is `"cors"` (lowercase) — this is already what the UI-SPEC uses. No mismatch.

Full verified types (ready to copy into `types.ts`):

```ts
export interface DiagnosticsVersion {
  version: string
  commit: string
  buildDate: string
}

export interface DiagnosticsHealth {
  live: boolean
  ready: boolean
  reason?: string
}

export interface DiagnosticsStorage {
  dbPath: string
  dbSizeBytes: number | null
  dbSizeReason?: string
  totalEvents: number
  totalSessions: number
  latestEventAt: string | null
}

export interface DiagnosticsAgent {
  id: string
  label: string
  eventCount: number
  lastSeenAt: string | null
  degradedCount: number
  normalizerVersion: string | null
  hookConfigStatus: string
  hookConfigReason?: string
  status: string
  warnings: string[]
}

export interface DiagnosticsIgnoreFile {
  path: string
  status: string
  activePatternCount: number
}

export interface DiagnosticsPrivacy {
  ignoreFile: DiagnosticsIgnoreFile
  exportWarning: string
}

export interface DiagnosticsRemoteBind {
  addr: string
  status: string
  allowRemote: boolean
}

export interface DiagnosticsCORS {
  totalOrigins: number
  localOrigins: number
  extraOrigins: number
}

export interface DiagnosticsSecurity {
  remoteBind: DiagnosticsRemoteBind
  cors: DiagnosticsCORS
}

export interface Diagnostics {
  version: DiagnosticsVersion
  health: DiagnosticsHealth
  storage: DiagnosticsStorage
  agents: DiagnosticsAgent[]
  privacy: DiagnosticsPrivacy
  security: DiagnosticsSecurity
}
```

---

## Common Pitfalls

### Pitfall 1: Skeleton re-renders during refresh

**What goes wrong:** Using `if (loading || refreshing)` to show skeleton causes a visual flash when user clicks Refresh — existing data disappears and is replaced with skeletons.
**Why it happens:** `refreshing` state is true while data re-fetches, and both `loading` and `refreshing` are truthy in that window.
**How to avoid:** Show skeleton only when `loading === true` (no data yet). Show current data + spinner on `refreshing`. D-14 is explicit about this.
**Warning signs:** If "Retry Load" or the manual refresh button causes content to disappear, the condition is wrong.

### Pitfall 2: Default export breaks lazy route adapter

**What goes wrong:** If `DiagnosticsPage` is a default export, the lazy import adapter `.then((m) => ({ default: m.DiagnosticsPage }))` fails silently.
**Why it happens:** Named export is expected by the adapter pattern; default export would need a different form.
**How to avoid:** Always use `export function DiagnosticsPage`. All existing pages in this project are named exports. [VERIFIED: App.tsx + existing page files]

### Pitfall 3: `vi.stubGlobal('fetch')` needs to be per-test, not per-file

**What goes wrong:** A `vi.stubGlobal` at module level or describe level leaks state between tests.
**Why it happens:** `unstubGlobals: true` in `vite.config.ts` restores stubs only between files, but within a describe block stubs persist.
**How to avoid:** Stub inside `beforeEach` (or at the individual `it` level). Use `vi.clearAllMocks()` in `afterEach`. Pattern is established in `DashboardPage.test.tsx`. [VERIFIED: frontend/tests/features/dashboard/DashboardPage.test.tsx]

### Pitfall 4: `navigator.clipboard.writeText` not available in jsdom

**What goes wrong:** Tests that render the monospace path copy button throw `TypeError: navigator.clipboard is undefined`.
**Why it happens:** jsdom does not implement the Clipboard API.
**How to avoid:** In tests that render paths with copy buttons, mock clipboard: `Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, writable: true })`. Or structure tests to not trigger clipboard calls.

### Pitfall 5: `formatDistanceToNow` with null timestamp

**What goes wrong:** Passing `null` to `formatDistanceToNow` throws a type error since date-fns v4 is strict.
**Why it happens:** `lastUpdatedAt` starts as `null` before first successful fetch.
**How to avoid:** Guard: `lastUpdatedAt ? formatDistanceToNow(lastUpdatedAt, { addSuffix: true }) : null`. Render "Updated ..." span only when `lastUpdatedAt != null`. [VERIFIED: runtime test of formatDistanceToNow]

### Pitfall 6: Sidebar test expects specific nav items

**What goes wrong:** Existing `Sidebar.desktop.test.tsx` test checks for "Dashboard" label — adding "Diagnostics" does not break this, but any test checking for an exact list of items would fail.
**Why it happens:** New NAV_ITEMS entry changes the rendered output.
**How to avoid:** Read existing sidebar tests before modifying. The current test (`Sidebar.desktop.test.tsx`) checks for "Dashboard" by text — it will still pass. Only tests asserting "Monitor" or other removed items would fail. The new test should assert `/diagnostics` link is rendered. [VERIFIED: Sidebar.desktop.test.tsx]

---

## Code Examples

### Fetch error state (D-09)

```tsx
// Source: UI-SPEC error state contract
{error && (
  <Card className="p-6 flex flex-col items-center gap-3 text-center">
    <p className="text-sm text-foreground">Failed to load diagnostics</p>
    <p className="text-xs text-muted-foreground">Could not reach /api/diagnostics</p>
    <Button variant="outline" size="sm" onClick={reload}>Retry Load</Button>
  </Card>
)}
```

### Empty/first-run state (D-11)

```tsx
// Source: UI-SPEC empty state contract
{data.storage.totalEvents === 0 && data.agents.every((a) => a.status === 'no events') && (
  <div className="flex flex-col items-center gap-2 py-6 text-center">
    <p className="text-sm text-foreground">No activity observed yet</p>
    <p className="text-xs text-muted-foreground">
      Run <code className="font-mono">hooker setup</code> or{' '}
      <code className="font-mono">hooker doctor</code> to configure hook integrations.
    </p>
  </div>
)}
```

### Export warning (always visible, D-18)

```tsx
// Source: UI-SPEC Privacy panel contract
<Alert className="mt-4 border-[var(--border)] bg-[var(--secondary)]">
  <AlertDescription className="text-xs text-muted-foreground">
    {data.privacy.exportWarning}
  </AlertDescription>
</Alert>
```

### Test fixture — minimal Diagnostics object

```ts
// For test files: DiagnosticsPage.test.tsx
const healthyDiagnostics: Diagnostics = {
  version: { version: '1.1.0', commit: 'abc12345', buildDate: '2026-05-28' },
  health: { live: true, ready: true },
  storage: {
    dbPath: '/home/user/.hooker/hooker.db',
    dbSizeBytes: 1024000,
    totalEvents: 42,
    totalSessions: 5,
    latestEventAt: '2026-05-28T10:00:00Z',
  },
  agents: [
    {
      id: 'claudecode',
      label: 'Claude Code',
      eventCount: 30,
      lastSeenAt: '2026-05-28T09:55:00Z',
      degradedCount: 0,
      normalizerVersion: '1.0.0',
      hookConfigStatus: 'configured',
      status: 'healthy',
      warnings: [],
    },
    {
      id: 'codex',
      label: 'Codex',
      eventCount: 12,
      lastSeenAt: '2026-05-28T08:00:00Z',
      degradedCount: 0,
      normalizerVersion: null,
      hookConfigStatus: 'configured',
      status: 'healthy',
      warnings: [],
    },
    {
      id: 'geminicli',
      label: 'Gemini CLI',
      eventCount: 0,
      lastSeenAt: null,
      degradedCount: 0,
      normalizerVersion: null,
      hookConfigStatus: 'unknown',
      status: 'no events',
      warnings: [],
    },
  ],
  privacy: {
    ignoreFile: { path: '/home/user/.hooker/.ignore', status: 'loaded', activePatternCount: 3 },
    exportWarning: 'Exported data may contain prompts, diffs, file paths, and tool outputs.',
  },
  security: {
    remoteBind: { addr: '127.0.0.1:8765', status: 'loopback', allowRemote: false },
    cors: { totalOrigins: 1, localOrigins: 1, extraOrigins: 0 },
  },
}
```

### Test pattern — fetch mock (established vi.stubGlobal pattern)

```ts
// Source: DashboardPage.test.tsx + established project test pattern
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => healthyDiagnostics,
    })
  )
})

afterEach(() => {
  vi.clearAllMocks()
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vi.spyOn(Storage.prototype)` for fetch mocking | `vi.stubGlobal('fetch', vi.fn())` | Phase 2 (decision recorded in STATE.md) | Required — `unstubGlobals: true` in vite.config breaks spyOn restore |
| Default exports for page components | Named exports with lazy adapter | Established from project start | Naming + barrel file conventions require named exports |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is frontend-only code changes. No external tools, services, CLIs, runtimes, or databases beyond the project's existing Node.js/pnpm stack are introduced. All required packages are already installed.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Stethoscope` is available in the installed version of `lucide-react` | Standard Stack / Sidebar Pattern | If missing, substitute another icon (e.g. `Activity`); low risk — Stethoscope has been in lucide-react since early versions [ASSUMED — not runtime-verified] |
| A2 | `size="icon-sm"` Button variant is supported by the project's shadcn Button configuration | Code Examples | Dashboard already uses `size="icon-sm"` on the refresh button, so this is effectively verified by analogy [ASSUMED — not read from button.tsx directly] |

---

## Open Questions

1. **No open questions.** The backend contract is locked and verified (Phase 5 VERIFICATION.md), the UI-SPEC is approved, all decisions are explicit in CONTEXT.md (D-01 through D-20), and all required components are confirmed installed. The planner can proceed directly to task decomposition.

---

## Sources

### Primary (HIGH confidence)

- `backend/internal/domain/diagnostics.go` — authoritative backend type definitions, JSON tags verified
- `frontend/src/App.tsx` — lazy route pattern confirmed
- `frontend/src/app/Sidebar.tsx` — NAV_ITEMS structure and renderNavButton pattern confirmed
- `frontend/src/pages/Dashboard.tsx` — page shell, refresh button, skeleton-branch pattern confirmed
- `frontend/src/features/dashboard/hooks/useDashboardStats.ts` — hook shape confirmed
- `frontend/tests/features/dashboard/DashboardPage.test.tsx` — test pattern confirmed
- `frontend/tests/app/Sidebar.desktop.test.tsx` — sidebar test target confirmed
- `frontend/src/components/ui/` — all required shadcn components confirmed present
- `.planning/phases/06-diagnostics-ui/06-CONTEXT.md` — all locked decisions
- `.planning/phases/06-diagnostics-ui/06-UI-SPEC.md` — visual/interaction contract

### Secondary (MEDIUM confidence)

- `frontend/vite.config.ts` — test config (unstubGlobals, setupFiles, include pattern) confirmed
- `frontend/src/test/setup.ts` — global test setup (matchMedia mock, cleanup) confirmed
- Runtime test: `date-fns formatDistanceToNow(new Date(Date.now() - 120000))` → "2 minutes" — v4 API confirmed functional

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified present in package.json and filesystem
- Architecture: HIGH — directly mirrors established Dashboard pattern with verified source reads
- Types contract: HIGH — cross-referenced Go domain types against UI-SPEC interface definitions
- Test patterns: HIGH — verified via existing test files
- Pitfalls: HIGH — derived from verified codebase observations (vitest config, test files, existing patterns)

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (stable stack — no fast-moving dependencies introduced)
