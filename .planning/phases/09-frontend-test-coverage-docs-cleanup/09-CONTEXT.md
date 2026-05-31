# Phase 9: Frontend Test Coverage & Docs Cleanup - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 closes the v1.2 frontend test and stale-doc cleanup requirements. It adds or tightens Vitest coverage for DiagnosticsPage, UsagePage, and VersionBadge rendering states, and removes stale placeholder/reference material from active `docs/superpowers/specs/` and `docs/superpowers/plans/` docs.

This phase is test and documentation cleanup only. It should not redesign the Diagnostics page, Usage page, VersionBadge behavior, usage APIs, or session file-change UI. Production code changes are allowed only when a required test exposes a real bug or testability blocker.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Requirements
- `.planning/ROADMAP.md` — Phase 9 title, goal, success criteria, and TEST/DOCS requirement mapping.
- `.planning/REQUIREMENTS.md` — TEST-01, TEST-02, TEST-03, and DOCS-01 requirement text.
- `.planning/PROJECT.md` — v1.2 Polish & Cleanup constraints: no new features, local-first product posture, low-maintenance solo-developer defaults.
- `.planning/STATE.md` — current milestone state and Phase 9 position.

### Prior Decisions
- `.planning/phases/06-diagnostics-ui/06-CONTEXT.md` — locked DiagnosticsPage rendering, warning, empty/error, refresh, and privacy-panel decisions.
- `.planning/phases/08-session-file-changes-view/08-CONTEXT.md` — confirms trace/timeline route replacement; useful when judging stale superpowers docs about trace/timeline/session waterfall work.

### Frontend Implementation
- `frontend/src/features/diagnostics/DiagnosticsPage.tsx` — page states and rendered branches for TEST-01.
- `frontend/src/features/diagnostics/hooks/useDiagnostics.ts` — diagnostics fetch hook and state behavior behind TEST-01.
- `frontend/src/features/diagnostics/types.ts` — Diagnostics response fixture shape.
- `frontend/src/features/usage/UsagePage.tsx` — Usage page shell for TEST-02.
- `frontend/src/features/usage/UsagePanel.tsx` — key entry point for UsagePage empty/loading/populated UI.
- `frontend/src/features/usage/hooks/useOpenAIUsage.ts` — usage fetch/cache hook to exercise in TEST-02.
- `frontend/src/features/usage/UsageCharts.tsx` — populated usage chart UI.
- `frontend/src/features/usage/UsageTables.tsx` — populated usage table UI.
- `frontend/src/types/usage.ts` — OpenAI/Anthropic usage fixture types.
- `frontend/src/features/version/VersionBadge.tsx` — badge rendering and accessible label for TEST-03.
- `frontend/src/features/version/useVersion.ts` — `/api/version` fetch behavior for TEST-03.

### Existing Tests and Test Patterns
- `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx` — current DiagnosticsPage state coverage and fixture style.
- `frontend/tests/features/diagnostics/DiagnosticsRoute.test.tsx` — route-level diagnostics smoke coverage.
- `frontend/tests/features/usage/UsagePage.test.tsx` — current UsagePage shell/empty-control tests to extend.
- `frontend/tests/features/sessions/useFileChanges.test.ts` — recent hook-state testing pattern with `vi.stubGlobal('fetch')`.
- `frontend/src/test/setup.ts` — Testing Library/Vitest setup and global cleanup behavior.
- `.planning/codebase/TESTING.md` — Vitest, Testing Library, `vi.stubGlobal`, and test organization conventions.
- `.planning/codebase/CONVENTIONS.md` — frontend naming, imports, formatting, and lint conventions.
- `.planning/codebase/STRUCTURE.md` — source/test directory locations.

### Docs Cleanup Targets
- `docs/superpowers/specs/2026-05-13-sessions-waterfall-redesign.md` — stale session waterfall/trace direction candidate.
- `docs/superpowers/specs/2026-05-14-project-scoped-session-traces.md` — stale trace/timeline/session route direction candidate.
- `docs/superpowers/specs/2026-05-15-semantic-session-summaries.md` — stale or unfinished superpowers spec candidate.
- `docs/superpowers/specs/2026-05-16-trace-panel-responsive-design.md` — stale trace panel direction candidate after Phase 8 replacement.
- `docs/superpowers/plans/2026-05-13-sessions-waterfall.md` — stale plan candidate.
- `docs/superpowers/plans/2026-05-13-sessions-waterfall-redesign.md` — stale plan candidate.
- `docs/superpowers/plans/2026-05-15-semantic-session-summaries-plan.md` — stale plan candidate.
- `docs/superpowers/plans/2026-05-16-trace-panel-responsive.md` — stale trace panel plan candidate.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/tests/features/diagnostics/DiagnosticsPage.test.tsx` already defines realistic Diagnostics fixtures and covers loading, error, loaded, degraded, first-run, not-ready, and refresh behavior.
- `frontend/tests/features/usage/UsagePage.test.tsx` already stubs localStorage and fetch, and renders UsagePage under MemoryRouter.
- `frontend/src/features/usage/hooks/useOpenAIUsage.ts` caches usage stats in localStorage and returns visible cached stats when the provider/range cache key matches.
- `frontend/src/features/version/useVersion.ts` returns `null` until a successful `/api/version` response sets data, making absent rendering the expected loading/error behavior.

### Established Patterns
- Frontend tests live under `frontend/tests/features/<feature>/`.
- Tests use Vitest, Testing Library, `MemoryRouter`, `vi.stubGlobal('fetch')`, `vi.stubGlobal('localStorage')`, and async `findBy*` / `waitFor` assertions.
- Prior frontend test decisions prohibit fragile Storage prototype spying; re-stub localStorage per test when needed.
- Assertions should target user-observable UI and accessibility labels rather than private state.

### Integration Points
- TEST-01 likely requires auditing before adding DiagnosticsPage tests because current coverage may already satisfy the named branches.
- TEST-02 should extend `frontend/tests/features/usage/UsagePage.test.tsx` with loading and populated scenarios driven through UsagePage.
- TEST-03 likely needs a new focused test file under `frontend/tests/features/version/` unless planning finds an existing version test.
- DOCS-01 requires deleting or otherwise removing stale placeholder/reference files from active `docs/superpowers/specs/` and `docs/superpowers/plans/`.

</code_context>

<specifics>
## Specific Ideas

- The user delegated the remaining decisions to best practice rather than specifying preferences.
- Best practice for this phase is narrow, evidence-based cleanup: write tests that prove the stated rendering states and remove stale docs from active locations without broad UI or docs rewrites.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-Frontend Test Coverage & Docs Cleanup*
*Context gathered: 2026-05-31*
