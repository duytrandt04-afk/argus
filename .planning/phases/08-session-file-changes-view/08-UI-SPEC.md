---
phase: 08
slug: session-file-changes-view
status: approved
shadcn_initialized: true
preset: radix-nova b2fA
created: 2026-05-31
---

# Phase 08 - UI Design Contract

> Visual and interaction contract for Phase 8: Session File Changes View.

This phase turns the session detail route into a file-change browser. The page must feel like a dense local operator tool: fast to scan, mono-heavy for paths and code, quiet in color, and focused on changed files and old/new snippets. It must not preserve the trace tree, event timeline, zoom controls, or trace inspection panel as part of the primary page.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | radix-nova, neutral, Geist, radius default |
| Component library | radix |
| Icon library | lucide |
| Font | Geist for shadcn surfaces, JetBrains Mono for paths, timestamps, line numbers, and code snippets |

Use existing local primitives from `frontend/src/components/ui/`. No new registry block is required for this phase. Preferred primitives:

- `Button` for pagination and disclosure controls.
- `Badge` for tool/action labels, file counts, and line metadata.
- `Separator` for structural dividers.
- `Skeleton` for initial loading rows.
- `Empty` for the no-file-changes state.
- `Card` only for repeated file rows or compact summary blocks, not for wrapping the whole page.

`PaginationBar` in `frontend/src/components/shared/PaginationBar.tsx` may be reused if updated to shadcn `Button` controls. If it remains raw-button based, either refactor it inside the plan or implement a local file-pagination control that follows this contract.

---

## Page Layout

The route `/sessions/:cwd/:sessionId` should have one primary vertical flow:

1. Compact header.
2. File pagination bar.
3. Paginated file list.
4. Expanded per-file change snippets.

### Compact Header

Keep the header on one quiet band at the top of the page.

Required content:

- Breadcrumbs: `Projects / {project} / {session-short-id}`.
- Session facts: started time, duration, ended time when available.
- File-change count.

Header rules:

- Keep height compact; target 64-88px on desktop.
- Wrap metadata cleanly on mobile.
- Do not include trace controls, zoom controls, or a "Trace" section label.
- Do not add a hero block or explanatory copy.

### File Pagination

Paginate changed files, not individual change events.

Required behavior:

- Show current range and total files, for example `1-25 of 83 files`.
- Provide first, previous, next, and last controls when there is more than one page.
- Provide a compact page-size control only if it does not make the header feel busy.
- Reset to page 1 when page size changes.

Default page size: 25 files. The planner may choose 20 or 50 if it better fits existing helpers, but the page must remain compact.

### File Rows

Each file row is a repeated item, so a `Card size="sm"` or a card-like bordered row is acceptable.

Collapsed row content:

- File icon based on the first or dominant tool/action.
- Shortened path, mono, truncating in the middle or at the left edge when space is tight.
- Change count badge.
- Last change timestamp or relative time from session start.
- Disclosure indicator.

Expanded row content:

- A vertical list of changes for that file.
- Each change shows timestamp, tool/action, line number when available, and old/new snippets.
- Keep snippets compact; do not render a full GitHub-style diff in this phase.

---

## Spacing Scale

Declared values are 4px based.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Badge gaps, snippet label gaps, line-number gaps |
| sm | 8px | File-row internal spacing, compact metadata groups |
| md | 16px | Page horizontal padding, file-list gaps |
| lg | 24px | Header-to-list separation on desktop |
| xl | 32px | Not used unless needed for wide desktop breathing room |
| 2xl | 48px | Not used |
| 3xl | 64px | Not used |

Exceptions:

- Code snippets may use dense padding such as `px-2 py-1.5`.
- Pagination controls may use `size="icon-xs"` or `size="icon-sm"`.
- File rows should use 6-8px radius; avoid large rounded cards.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 12px to 14px | 400 | 1.4 |
| Label | 10px to 12px | 600 to 700 | 1.2 |
| Heading | 12px to 14px | 600 | 1.3 |
| Code | 11px to 12px | 400 to 500 | 1.45 |
| Display | not applicable | not applicable | not applicable |

Rules:

- Paths, line numbers, timestamps, and snippets use mono styling.
- Header labels stay compact and subdued.
- Do not introduce page-scale display type.
- Letter spacing must remain normal except for existing compact uppercase labels.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0a0a0a`, `#111111`, semantic `background` | Page background |
| Secondary (30%) | `#101116`, `#111216`, semantic `card` / `muted` | Header band, file rows, snippet panels |
| Accent (10%) | emerald, sky, violet, amber Tailwind utilities | Tool/action badges and active disclosure states |
| Destructive | `#ff5f56` / `text-red-400` | Fetch errors only |

Accent reserved for:

- Tool/action badges: write/create = emerald, edit/replace = sky, multiedit/notebook = violet, fallback/unknown = amber.
- Expanded row highlight or focused row ring.
- Error text for fetch failure.

Do not make the page predominantly purple, blue, beige, or gradient-driven. The page should read as neutral dark with semantic action accents.

---

## Snippet Contract

### Change Entry

Each change entry includes:

- Relative timestamp from session start, falling back to clock time if session start is missing.
- Tool/action label.
- `L{start_line}` when available.
- Old snippet block when `old_string` is present.
- New snippet block when `new_string` is present.

### Old/New Blocks

Use two compact code blocks stacked on mobile and side-by-side only if the available width is comfortable.

Recommended visual treatment:

- Old block label: `Before`
- New block label: `After`
- Old block tint: subtle red border/text accent, not a full red panel.
- New block tint: subtle emerald border/text accent, not a full green panel.
- Empty values are not rendered as blank code blocks.

If both `old_string` and `new_string` are absent, show a muted metadata-only note such as `No inline snippet captured for this change.`

Line wrapping:

- Preserve whitespace with `whitespace-pre-wrap`.
- Use `break-words` for long generated lines.
- Cap very large snippets with a max height and internal scroll only if needed; do not let one change make the entire page unusable.

---

## Interaction Contract

- Clicking a file row toggles expanded/collapsed state.
- File rows must expose `aria-expanded`.
- Pagination controls must be `Button` primitives, disabled at bounds, and keyboard reachable.
- Expanded state may reset when changing pages.
- No trace selection, double-click-to-open-panel behavior, zoom controls, split panels, or mobile trace overlay should remain in this page.
- The page should not introduce search/filter controls in Phase 8.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page label | `File changes` |
| File count | `{count} files changed` |
| Loading state | `Loading file changes...` |
| Empty state heading | `No file changes recorded for this session.` |
| Empty state body | `This session did not create or modify files that hooker captured.` |
| Error state | `Failed to load file changes: {error}` |
| Old snippet label | `Before` |
| New snippet label | `After` |
| Metadata-only note | `No inline snippet captured for this change.` |

No visible instructional copy about how to use the page. The row disclosure affordance should be obvious from the layout.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Existing local `Button`, `Badge`, `Separator`, `Skeleton`, `Empty`, optional `Card` | No registry add required |
| third-party | none | Not allowed for this phase |

No `npx shadcn add` is needed. If implementation discovers a missing primitive, stop and update this UI-SPEC before adding a registry component.

---

## Verification Contract

Implementation verification must include:

- `/sessions/:cwd/:sessionId` no longer renders `TraceTreeNode`, `EventTimeline`, timeline ticks, zoom controls, or `TraceInspectionPanel`.
- A session with file changes renders a paginated file list.
- Expanding a file renders per-change timestamp, tool/action, available line number, and old/new snippets.
- A session with no file changes renders the empty state copy above.
- Fetch failure renders the error state copy above.
- TypeScript passes for the frontend.
- Relevant frontend tests pass or any unrelated failures are documented.

Manual UI smoke:

- Desktop: header, pagination, and expanded snippets fit without overlap.
- Mobile: header metadata wraps, rows remain tappable, snippets stack vertically.
- Keyboard: pagination and file disclosure controls are reachable and visible on focus.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-31
