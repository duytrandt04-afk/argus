# Phase 09: frontend-test-coverage-docs-cleanup - Research

**Researched:** 2026-05-31  
**Domain:** Frontend Vitest/Testing Library coverage and stale documentation cleanup  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Coverage Boundaries
- **D-01:** Fill the exact requirement gaps first: DiagnosticsPage loading/error/healthy/degraded, UsagePage loading/empty/populated, and VersionBadge loaded/loading/error.
- **D-02:** If an existing suite already covers a required branch well, treat that branch as done and avoid churn. Tighten assertions only where coverage is too shallow to prove the user-visible state.
- **D-03:** Prefer user-visible assertions over internal implementation details. Tests should assert rendered headings, empty/error/loading panels, charts/tables/badges, retry/fetch controls, and absence of output where behavior is intentionally null.
- **D-04:** Include nearby edge states only when the UI already exposes them and the fixture cost is low. Do not expand Phase 9 into a broad frontend regression suite.

### DiagnosticsPage Coverage
- **D-05:** Keep the existing DiagnosticsPage suite as the base. It already covers several Phase 9 branches and Phase 6 decisions; planning should audit gaps before adding duplicate tests.
- **D-06:** Preserve the Phase 6 operator-surface decisions: skeleton on first load, compact retry panel on error, warning badges for degraded/security posture, first-run soft hint, and data remaining visible during refresh.
- **D-07:** Diagnostics tests should continue using `vi.stubGlobal('fetch')`, `MemoryRouter`, Testing Library DOM queries, and explicit `navigator.clipboard` stubbing where copy affordances are rendered.

### UsagePage Coverage
- **D-08:** Prefer exercising the real `UsagePage` / `UsagePanel` / `useOpenAIUsage` path rather than mocking the whole hook. This gives meaningful coverage for loading, empty, and populated states.
- **D-09:** Use localStorage and fetch stubs to drive states. Keep fixtures small but structurally realistic enough for `UsageCharts` and `UsageTables` to render populated content.
- **D-10:** Empty state means no admin API key is available and the page renders the existing `Admin API Key Required` panel.
- **D-11:** Loading state should be verified by a pending usage fetch with a key present, showing the current loading panel/control state without asserting private hook variables.
- **D-12:** Populated state should prove that successful usage responses render visible chart/table summary content. Tests do not need exhaustive provider/API pagination coverage unless needed to reach the populated UI.

### VersionBadge Coverage
- **D-13:** Preserve current VersionBadge behavior: it renders a version label only after `/api/version` succeeds with data.
- **D-14:** Loading and error states intentionally render `null`. Phase 9 should test this absence rather than adding a visible fallback.
- **D-15:** Loaded state should assert both plain version rendering and commit-shortening behavior, including the accessible `aria-label`.

### Docs Cleanup
- **D-16:** Remove stale placeholder/reference docs from active `docs/superpowers/specs/` and `docs/superpowers/plans/` unless planning finds a concrete reason one is still a finalized active document.
- **D-17:** Do not create a new archive location just to preserve stale docs. Git history is sufficient for this cleanup unless a document is still authoritative.
- **D-18:** The cleanup target is active placeholder/stale-reference content, especially docs that describe the removed trace/timeline/session-waterfall direction. Do not edit unrelated product docs unless they directly link to or depend on these stale files.

### the agent's Discretion
- The user delegated all Phase 9 gray-area choices to the agent: "just do what you think is the best practice."
- Planner may decide exact test file split and fixture helper extraction, but should keep changes localized to the named page/feature tests and directly related test helpers.
- Planner may choose whether docs cleanup is a dedicated plan or grouped with tests, provided DOCS-01 remains separately verifiable.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | DiagnosticsPage has Vitest tests covering all main rendering states: loading, error, healthy, degraded. | Existing `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx` already covers these branches; planner should audit assertions and avoid duplicate churn. [VERIFIED: codebase grep] |
| TEST-02 | UsagePage has Vitest tests covering main rendering states: loading, empty, populated. | Existing `UsagePage.test.tsx` covers empty/control states only; planner should add pending-fetch loading and successful populated fixtures through real `UsagePage`/`UsagePanel`/`useOpenAIUsage`. [VERIFIED: codebase grep] |
| TEST-03 | VersionBadge / version feature has Vitest tests covering loaded, loading, and error states. | No `frontend/tests/features/version/` suite exists; planner should add `VersionBadge.test.tsx`. [VERIFIED: codebase grep] |
| DOCS-01 | Stale placeholder spec files in `docs/superpowers/specs/` and `docs/superpowers/plans/` are archived or removed. | Eight active stale docs were found under those directories, mostly trace/timeline/session-waterfall docs superseded by Phase 8; context locks removal over archive unless still authoritative. [VERIFIED: codebase grep] |
</phase_requirements>

## Summary

Phase 09 should be planned as a narrow verification and cleanup phase, not a frontend feature phase. DiagnosticsPage is already substantially covered, UsagePage needs two meaningful state tests beyond its current empty/control checks, VersionBadge needs a new focused suite, and stale superpowers docs should be removed from active docs. [VERIFIED: `.planning/phases/09-frontend-test-coverage-docs-cleanup/09-CONTEXT.md` + codebase grep]

The current frontend test stack is Vitest 4.1.5, React Testing Library 16.3.2, jest-dom 6.9.1, user-event 14.6.1, jsdom 29.1.1, React 19.2.6, and React DOM 19.2.6 as installed locally. Latest registry versions checked on 2026-05-31 are Vitest 4.1.7, React Testing Library 16.3.2, jest-dom 6.9.1, user-event 14.6.1, jsdom 29.1.1, React 19.2.6, and React DOM 19.2.6. [VERIFIED: `pnpm list` + `npm view`]

**Primary recommendation:** Plan three localized tasks: audit/tighten DiagnosticsPage only if needed, extend UsagePage and add VersionBadge tests, then delete stale `docs/superpowers/specs/` and `docs/superpowers/plans/` files with a placeholder-content scan. [VERIFIED: codebase grep]

## Project Constraints (from AGENTS.md)

- Use RTK-prefixed shell commands for command examples where practical. [CITED: `/Users/duytran/.codex/RTK.md`]
- Prefer CodeGraph for structural code questions and native grep/read only for literal text queries. [VERIFIED: AGENTS.md instructions supplied by user]
- Use `codegraph_context` first for architecture/trace questions and avoid grep-first symbol lookup. [VERIFIED: AGENTS.md instructions supplied by user]
- Trust CodeGraph structural results and do not re-verify them with grep unless doing literal text checks. [VERIFIED: AGENTS.md instructions supplied by user]
- If `.codegraph/` is not initialized, ask before running `codegraph init -i`. [VERIFIED: AGENTS.md instructions supplied by user]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Diagnostics rendering-state coverage | Browser / Client | API / Backend fixture shape | Tests render React UI branches and stub `/api/diagnostics`; backend behavior is not changed in this phase. [VERIFIED: codebase grep] |
| Usage rendering-state coverage | Browser / Client | API / Backend fixture shape, localStorage | Tests should drive the real page/hook with localStorage and fetch stubs. [VERIFIED: codebase grep] |
| VersionBadge state coverage | Browser / Client | API / Backend fixture shape | `VersionBadge` renders based on `useVersion()` fetch state and intentionally returns `null` before success. [VERIFIED: codegraph_context] |
| Stale superpowers docs cleanup | Repository docs | Git history | Cleanup is file deletion/removal from active docs; git history preserves deleted material. [VERIFIED: CONTEXT.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest` | Installed 4.1.5; latest 4.1.7 modified 2026-05-20 | Test runner and mocking API | Already configured in `frontend/vite.config.ts`; official docs support `vi.stubGlobal` and `unstubGlobals`. [VERIFIED: `pnpm list` + `npm view`] [CITED: https://vitest.dev/guide/mocking/globals.html] |
| `@testing-library/react` | Installed/latest 16.3.2 modified 2026-01-19 | React component rendering and DOM queries | Existing tests use it; Testing Library async methods support `findBy*`/`waitFor` for promise-driven UI states. [VERIFIED: `pnpm list` + `npm view`] [CITED: https://master--testing-library.netlify.app/docs/dom-testing-library/api-async/] |
| `@testing-library/jest-dom` | Installed/latest 6.9.1 modified 2025-12-13 | DOM matchers like `toBeInTheDocument` | Already imported in `frontend/src/test/setup.ts`. [VERIFIED: codebase grep + `npm view`] |
| `jsdom` | Installed/latest 29.1.1 modified 2026-04-30 | DOM environment for Vitest | Configured as `test.environment = 'jsdom'` in `frontend/vite.config.ts`. [VERIFIED: codebase grep + `npm view`] |
| `react` / `react-dom` | Installed/latest 19.2.6 modified 2026-05-29 | Component runtime | Current frontend runtime; tests should not introduce version-specific workarounds. [VERIFIED: `pnpm list` + `npm view`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@testing-library/user-event` | Installed/latest 14.6.1 modified 2025-12-13 | User-like interactions | Use only if UsagePage tests type/click controls; simple render-state assertions can use direct stubs and Testing Library queries. [VERIFIED: `pnpm list` + `npm view`] |
| `react-router-dom` | Installed 7.14.2 from package.json | Router context | Existing page tests wrap pages in `MemoryRouter`; continue that pattern. [VERIFIED: codebase grep] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Real `UsagePage`/hook path | Mock `useOpenAIUsage` | Faster fixture setup, but contradicts locked decision D-08 and provides weaker integration coverage. [VERIFIED: CONTEXT.md] |
| New e2e/browser tests | Playwright/browser-mode tests | Higher UI realism, but Phase 09 requirements are Vitest coverage and no e2e infra exists. [VERIFIED: `.planning/codebase/TESTING.md`] |
| Archiving stale docs | Deleting active stale docs | Context locks no new archive location; deletion keeps active docs clean and git history preserves removed material. [VERIFIED: CONTEXT.md] |

**Installation:**

No new packages should be installed for this phase. [VERIFIED: package.json + CONTEXT.md]

**Version verification commands run:**

```bash
npm view vitest version time.modified dist-tags.latest
npm view @testing-library/react version time.modified dist-tags.latest
npm view @testing-library/jest-dom version time.modified dist-tags.latest
npm view @testing-library/user-event version time.modified dist-tags.latest
npm view jsdom version time.modified dist-tags.latest
npm view react version time.modified dist-tags.latest
npm view react-dom version time.modified dist-tags.latest
```

## Package Legitimacy Audit

No external packages are being installed in Phase 09, so the package legitimacy gate is not applicable. Existing packages are already present in `frontend/package.json` / lockfile and were version-checked through local install plus `npm view`. [VERIFIED: codebase grep + npm registry]

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| None new | npm | — | — | — | Not run | No install planned |

**Packages removed due to slopcheck [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
Vitest command
  |
  v
jsdom + frontend/src/test/setup.ts
  |
  v
Testing Library render(<MemoryRouter><Page /></MemoryRouter>)
  |
  +--> vi.stubGlobal('fetch') drives API response/pending/reject branches
  |
  +--> vi.stubGlobal('localStorage') drives UsagePage key/cache branches
  |
  v
User-visible assertions
  |
  +--> DiagnosticsPage: skeleton/error/healthy/degraded UI
  +--> UsagePage: empty/loading/populated chart/table UI
  +--> VersionBadge: visible version or null output

Docs cleanup command / file deletion
  |
  v
rg placeholder/stale terms under docs/superpowers/{specs,plans}
  |
  v
Directory empty or finalized-only
```

### Recommended Project Structure

```text
frontend/tests/features/
├── diagnostics/
│   └── DiagnosticsPage.test.tsx      # audit/tighten only if needed
├── usage/
│   └── UsagePage.test.tsx            # add loading and populated states
└── version/
    └── VersionBadge.test.tsx         # new focused suite

docs/superpowers/
├── specs/                            # remove stale trace/timeline specs
└── plans/                            # remove stale trace/timeline plans
```

### Pattern 1: Stub Globals Per Test

**What:** Use `vi.stubGlobal` for browser APIs such as `fetch` and `localStorage`, with setup in `beforeEach`. [CITED: https://vitest.dev/guide/mocking/globals.html]  
**When to use:** All Phase 09 tests that need fetch/localStorage state. [VERIFIED: codebase grep]  
**Example:**

```tsx
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => data }))
})
```

### Pattern 2: Await Async UI, Assert Visible Output

**What:** Use `findBy*` when elements appear asynchronously and `waitFor` when waiting for a mock or state transition. [CITED: https://master--testing-library.netlify.app/docs/dom-testing-library/api-async/]  
**When to use:** Diagnostics successful/error fetches, Usage populated fetch, VersionBadge success. [VERIFIED: codebase grep]  
**Example:**

```tsx
render(<VersionBadge />)
expect(await screen.findByLabelText(/application version/i)).toHaveTextContent('v1.2.3')
```

### Pattern 3: Test Intentional Absence With Container/Query

**What:** For `VersionBadge` loading/error, assert empty output or absence of the accessible label rather than adding UI. [VERIFIED: codegraph_context]  
**When to use:** TEST-03 loading and error states. [VERIFIED: CONTEXT.md]  
**Example:**

```tsx
const { container } = render(<VersionBadge />)
expect(container).toBeEmptyDOMElement()
expect(screen.queryByLabelText(/application version/i)).not.toBeInTheDocument()
```

### Anti-Patterns to Avoid

- **Mocking the whole Usage hook:** It would miss integration behavior between localStorage, `UsagePanel`, `useOpenAIUsage`, charts, and tables. [VERIFIED: CONTEXT.md]
- **Adding visible VersionBadge loading/error UI:** Current contract is `null` on loading/error. [VERIFIED: UI-SPEC + codegraph_context]
- **Broad docs rewriting:** DOCS-01 targets stale active superpowers specs/plans only. [VERIFIED: CONTEXT.md]
- **Using `pnpm test -- --run ...`:** In this repo that command ran the full suite; use `pnpm test --run <files>` for targeted Vitest execution. [VERIFIED: command output]
- **Concurrent tests with global stubs:** Vitest warns `unstubGlobals` can restore globals while concurrent tests still use them; keep these tests non-concurrent. [CITED: https://vitest.dev/config/unstubglobals]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async UI polling | Custom sleeps/timeouts | Testing Library `findBy*` / `waitFor` | Official async helpers retry against DOM mutations/promises. [CITED: https://master--testing-library.netlify.app/docs/dom-testing-library/api-async/] |
| Browser API shims | Ad hoc global mutation without cleanup | `vi.stubGlobal` with `unstubGlobals: true` | Existing config restores stubs between tests. [CITED: https://vitest.dev/guide/mocking/globals.html] [VERIFIED: codebase grep] |
| Usage fixture helpers as production code | Testability-only source changes | Inline test fixtures or test-local helpers | Phase scope allows production changes only for real bugs/blockers. [VERIFIED: CONTEXT.md] |
| Docs archive system | New archive directory/process | Delete stale active files | Context says git history is enough unless a doc remains authoritative. [VERIFIED: CONTEXT.md] |

**Key insight:** The complex part is not new infrastructure; it is driving existing React branches through realistic browser/API state while keeping assertions user-visible. [VERIFIED: codebase grep]

## Common Pitfalls

### Pitfall 1: Duplicating Diagnostics Coverage

**What goes wrong:** Planner adds duplicate TEST-01 cases even though current tests already cover loading, error, healthy, and degraded branches. [VERIFIED: codebase grep]  
**Why it happens:** Requirement text is read without auditing `DiagnosticsPage.test.tsx`. [VERIFIED: codebase grep]  
**How to avoid:** Treat Diagnostics as an audit/tightening task; only add assertions if a branch is too shallow. [VERIFIED: CONTEXT.md]  
**Warning signs:** New tests repeat `renders skeleton`, `renders retry panel`, `renders all sections`, or `renders degraded and extra CORS badges` without stronger assertions. [VERIFIED: codebase grep]

### Pitfall 2: Usage Populated Fixtures That Never Render Charts

**What goes wrong:** A successful fetch returns `{ data: [] }`, causing empty stats and weak assertions that do not prove `UsageCharts`/`UsageTables` rendering. [VERIFIED: codebase grep]  
**Why it happens:** `useOpenAIUsage` aggregates three parallel OpenAI fetches: primary completions, model-grouped usage, and api-key-grouped usage. [VERIFIED: codebase grep]  
**How to avoid:** Mock all three fetch responses with at least one bucket/result each and assert `Total Tokens`, `Total Requests`, `Model Breakdown`, `API Key Breakdown`, a model name, and a key ID. [VERIFIED: codebase grep]  
**Warning signs:** Test only asserts the page heading or fetch button after populated fetch. [VERIFIED: codebase grep]

### Pitfall 3: Loading State Disappears Too Fast

**What goes wrong:** Loading assertions run after the fetch resolves, so the test misses `Loading...` and `Loading usage data...`. [VERIFIED: codebase grep]  
**Why it happens:** React effects start fetch after render, and resolved promises can flush quickly. [ASSUMED]  
**How to avoid:** Use a never-resolving or manually controlled promise with a key present in `localStorage`. [VERIFIED: codebase grep]  
**Warning signs:** Test intermittently fails on loading text or only passes with arbitrary sleeps. [ASSUMED]

### Pitfall 4: VersionBadge Null State Is Mistaken For Missing Feature

**What goes wrong:** Planner adds loading/error placeholder UI to satisfy TEST-03. [VERIFIED: UI-SPEC]  
**Why it happens:** Tests often assert visible states, but this component intentionally renders nothing until success. [VERIFIED: codegraph_context]  
**How to avoid:** Assert `container` is empty and label is absent for pending/rejected/non-OK fetches. [VERIFIED: codegraph_context]  
**Warning signs:** Production changes to `VersionBadge.tsx` that add skeletons, retries, tooltips, or fallback copy. [VERIFIED: UI-SPEC]

### Pitfall 5: Stale Docs Look Approved

**What goes wrong:** Old trace/timeline docs have `Status: Approved`, so they might be preserved despite Phase 8 replacing the route direction. [VERIFIED: codebase grep + ROADMAP.md]  
**Why it happens:** These are historical superpowers docs, not current canonical phase docs. [VERIFIED: CONTEXT.md]  
**How to avoid:** Delete active stale docs listed in CONTEXT unless a planner can prove one remains authoritative. [VERIFIED: CONTEXT.md]  
**Warning signs:** Active docs still mention trace panels, session waterfall, project-scoped traces, or semantic session summaries after cleanup. [VERIFIED: codebase grep]

## Code Examples

### UsagePage Loading State

```tsx
const localStorageMock = {
  getItem: vi.fn((key: string) => (key === 'openai_admin_key' ? 'sk-test' : null)),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

renderUsagePage()

expect(await screen.findByRole('button', { name: 'Loading...' })).toBeDisabled()
expect(screen.getByText('Loading usage data...')).toBeInTheDocument()
```

Source: existing `UsagePanel` behavior and Vitest global mocking docs. [VERIFIED: codebase grep] [CITED: https://vitest.dev/guide/mocking/globals.html]

### UsagePage Populated State

```tsx
const day = Math.floor(new Date('2026-05-31T00:00:00Z').getTime() / 1000)
const fetchMock = vi
  .fn()
  .mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [{ start_time: day, end_time: day + 86400, results: [{ num_model_requests: 2, input_tokens: 100, output_tokens: 50 }] }],
    }),
  })
  .mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [{ start_time: day, end_time: day + 86400, results: [{ model: 'gpt-test', num_model_requests: 2 }] }],
    }),
  })
  .mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: [{ start_time: day, end_time: day + 86400, results: [{ api_key_id: 'key-test', input_tokens: 100, output_tokens: 50 }] }],
    }),
  })

vi.stubGlobal('fetch', fetchMock)
```

Source: `useOpenAIUsage` aggregate flow. [VERIFIED: codebase grep]

### VersionBadge Loaded And Null States

```tsx
vi.stubGlobal(
  'fetch',
  vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '1.2.3', commit: 'abcdef123', buildDate: '2026-05-31' }) })
)

render(<VersionBadge />)
expect(await screen.findByLabelText('Application version: v1.2.3 (abcdef1)')).toHaveTextContent('v1.2.3 (abcdef1)')
```

Source: `VersionBadge` + `useVersion`. [VERIFIED: codegraph_context]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Trace/timeline/session-waterfall docs under active superpowers specs/plans | File-change browser is current Phase 8 direction | Phase 8 completed 2026-05-31 | DOCS-01 should remove old active trace/timeline docs. [VERIFIED: ROADMAP.md + CONTEXT.md] |
| Static app version path | Runtime `/api/version` fetched by `VersionBadge` | Prior Phase 01 decision in STATE.md | VersionBadge tests must stub fetch and assert null before success. [VERIFIED: STATE.md + codegraph_context] |
| Fragile `Storage.prototype` spying | Per-test `vi.stubGlobal('localStorage')` | Prior Phase 02 decision in STATE.md | Usage tests should continue localStorage stubbing pattern. [VERIFIED: STATE.md + codebase grep] |
| Broad frontend smoke-only checks | Focused page/state Vitest suites | Phase 09 requirements | Planner should map required rendering branches directly to tests. [VERIFIED: REQUIREMENTS.md] |

**Deprecated/outdated:**
- Active trace/timeline superpowers specs/plans are outdated for v1.2 because Phase 8 replaced the trace/timeline route with a file-change browser. [VERIFIED: ROADMAP.md + docs grep]
- Production UI changes to VersionBadge loading/error are out of scope because the current UI contract is null output. [VERIFIED: UI-SPEC + codegraph_context]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React loading assertions can miss fast-resolving promises unless the test controls the pending promise. | Common Pitfalls | Loading tests may become flaky or fail to prove the intended branch. |
| A2 | Arbitrary sleeps are a warning sign for async UI tests. | Common Pitfalls | Tests may pass locally but fail in CI or on slower machines. |

## Open Questions

1. **Do any stale superpowers docs remain authoritative despite Phase 8?**
   - What we know: CONTEXT lists eight docs as cleanup candidates and locks removal unless a concrete reason exists. [VERIFIED: CONTEXT.md]
   - What's unclear: Whether the user has any out-of-repo reason to preserve a specific doc as finalized active material. [ASSUMED]
   - Recommendation: Plan deletion of all eight listed files, then run a targeted scan for placeholder/stale terms. [VERIFIED: CONTEXT.md]

2. **Should DiagnosticsPage get new tests or only assertion tightening?**
   - What we know: Current DiagnosticsPage suite passes and covers loading, error, healthy, degraded, first-run, not-ready, and refresh. [VERIFIED: targeted Vitest run]
   - What's unclear: Whether planner wants to call TEST-01 complete without edits or add a small assertion such as `aria-busy="true"` to strengthen loading. [VERIFIED: codebase grep]
   - Recommendation: Make TEST-01 an audit checkpoint; edit only if an assertion gap is found. [VERIFIED: CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vitest/frontend tooling | ✓ | v25.6.1 | Project requires >=18, so current version satisfies engine. [VERIFIED: command output + package.json] |
| pnpm | Frontend scripts | ✓ | 10.23.0 | Project requires >=10. [VERIFIED: command output + package.json] |
| Vitest | Frontend test runner | ✓ | 4.1.5 installed | No fallback needed. [VERIFIED: command output] |
| npm registry access | Package freshness checks | ✓ after escalation | — | Local lock/package data if offline. [VERIFIED: command output] |
| Context7 CLI (`ctx7`) | Preferred docs lookup fallback | ✗ | — | Official docs via web fetch/search used instead. [VERIFIED: command output] |

**Missing dependencies with no fallback:** none. [VERIFIED: environment audit]  
**Missing dependencies with fallback:** `ctx7`; official Vitest and Testing Library docs were fetched directly. [VERIFIED: environment audit]

## Validation Architecture

Skipped because `.planning/config.json` has `workflow.nyquist_validation: false`. [VERIFIED: `.planning/config.json`]

Recommended verification commands for the implementation plan:

```bash
cd frontend && pnpm test --run tests/features/diagnostics/DiagnosticsPage.test.tsx
cd frontend && pnpm test --run tests/features/usage/UsagePage.test.tsx
cd frontend && pnpm test --run tests/features/version/VersionBadge.test.tsx
cd frontend && pnpm run typecheck
rg -n "placeholder|stub|trace|timeline|waterfall|TODO|TBD|not implemented|semantic" docs/superpowers/specs docs/superpowers/plans
```

The correct targeted Vitest command shape is `pnpm test --run <files>` because `pnpm test -- --run <files>` ran all 20 test files in this repo. [VERIFIED: command output]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No auth logic changes; UsagePage tests use fake local API keys only. [VERIFIED: phase scope] |
| V3 Session Management | no | No session/cookie changes. [VERIFIED: phase scope] |
| V4 Access Control | no | No authorization paths change. [VERIFIED: phase scope] |
| V5 Input Validation | yes | Keep fetch fixtures typed/structured; do not weaken UI assumptions or parse arbitrary docs with unsafe code. [VERIFIED: codebase grep] |
| V6 Cryptography | no | No crypto/secrets implementation changes. [VERIFIED: phase scope] |

### Known Threat Patterns for Frontend Tests/Docs

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Accidental real API key use in tests | Information Disclosure | Use fake strings like `sk-test`; never read process env for UsagePage tests. [VERIFIED: phase scope] |
| Preserving stale docs that describe removed insecure trace/timeline direction | Spoofing / Tampering via misleading docs | Remove active stale docs and rely on git history. [VERIFIED: CONTEXT.md] |
| Over-mocking UI paths | Tampering with test signal | Exercise real page/panel/hook path for UsagePage. [VERIFIED: CONTEXT.md] |

## Sources

### Primary (HIGH confidence)

- `frontend/vite.config.ts` — Vitest `jsdom`, setup file, include glob, and `unstubGlobals: true`. [VERIFIED: codebase grep]
- `frontend/package.json` and `pnpm list` — installed frontend testing stack. [VERIFIED: command output]
- `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx` — existing TEST-01 coverage baseline. [VERIFIED: codebase grep]
- `frontend/tests/features/usage/UsagePage.test.tsx` — existing TEST-02 gaps. [VERIFIED: codebase grep]
- `frontend/src/features/version/VersionBadge.tsx` and `useVersion.ts` — TEST-03 behavior. [VERIFIED: codegraph_context]
- Vitest docs for global mocking and `unstubGlobals`: https://vitest.dev/guide/mocking/globals.html and https://vitest.dev/config/unstubglobals. [CITED: official docs]
- Testing Library async docs: https://master--testing-library.netlify.app/docs/dom-testing-library/api-async/. [CITED: official docs]

### Secondary (MEDIUM confidence)

- npm registry version metadata from `npm view` for existing packages. [VERIFIED: npm registry]
- `.planning/codebase/TESTING.md` and `.planning/codebase/CONVENTIONS.md` — repo conventions generated earlier in planning. [VERIFIED: codebase grep]

### Tertiary (LOW confidence)

- Assumptions about async loading flakiness and avoiding sleeps are based on testing practice plus current code behavior, not a phase-specific official source. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions confirmed locally and latest versions checked through npm registry; no new package installs planned. [VERIFIED: command output]
- Architecture: HIGH — CodeGraph and source reads identify the exact components, hooks, and test files. [VERIFIED: codegraph_context + codebase grep]
- Pitfalls: MEDIUM-HIGH — most pitfalls are directly grounded in current code and official Vitest/Testing Library docs; two async testing cautions are assumed best practice. [VERIFIED: codebase grep] [ASSUMED]

**Research date:** 2026-05-31  
**Valid until:** 2026-06-30 for repo-local plan shape; 2026-06-07 for npm latest-version metadata.
