# Phase 9: Frontend Test Coverage & Docs Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 9-frontend-test-coverage-docs-cleanup
**Areas discussed:** Coverage boundaries, UsagePage fixture strategy, VersionBadge behavior, Docs cleanup semantics

---

## Coverage Boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Fill only missing gaps | Treat existing good coverage as done and add only missing required branches. | ✓ |
| Tighten all suites broadly | Rework each suite to fully restate every branch in the requirement. | |
| Expand to edge-state coverage | Include nearby edge states even if not named by the requirement. | |

**User's choice:** Delegated to the agent: "just do what you think is the best practice."
**Notes:** Best-practice decision is to fill exact gaps first, avoid duplicate coverage, and tighten assertions only where a branch is too shallow to prove user-visible behavior.

---

## UsagePage Fixture Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Exercise real page/hook path | Drive UsagePage through localStorage and fetch stubs so loading, empty, and populated states are integrated. | ✓ |
| Mock component boundary | Mock UsagePanel or useOpenAIUsage to make page-state tests simpler. | |
| Split hook and page tests | Add separate hook tests plus a small page smoke suite. | |

**User's choice:** Delegated to the agent.
**Notes:** Best-practice decision is to use the real UsagePage/UsagePanel/useOpenAIUsage path where practical because the current gap is page rendering state coverage.

---

## VersionBadge Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve null loading/error | Test the current intentional behavior: no badge until version data loads. | ✓ |
| Add visible fallback | Change production UI to show loading/error version states. | |
| Let planner decide | Leave behavior open during planning. | |

**User's choice:** Delegated to the agent.
**Notes:** Best-practice decision is to preserve existing behavior from prior project context: VersionBadge renders nothing on loading/error and a compact version label when loaded.

---

## Docs Cleanup Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Remove from active docs | Delete stale placeholder/reference specs and plans; rely on git history for recovery. | ✓ |
| Archive elsewhere | Move stale docs to an inactive archive directory. | |
| Edit in place | Keep the files but rewrite stale sections. | |

**User's choice:** Delegated to the agent.
**Notes:** Best-practice decision is to remove stale docs from active `docs/superpowers/specs/` and `docs/superpowers/plans/` unless planning finds a file is still authoritative. Creating an archive would preserve clutter without adding value.

---

## the agent's Discretion

- The user selected all gray areas and then delegated decisions to the agent's best-practice judgment.
- The agent chose narrow test coverage, user-visible assertions, real page/hook usage fixtures where practical, existing VersionBadge behavior, and removal of stale active docs.

## Deferred Ideas

None.
