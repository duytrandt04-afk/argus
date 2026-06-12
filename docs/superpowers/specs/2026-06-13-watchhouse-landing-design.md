# The Watchhouse — landing page design spec

Date: 2026-06-13
Scope: `frontend-landing/` (getargus.org). No backend changes.

## Concept

Editorial serif voice layered over the existing instrument-panel DNA. The page
reads like a watchhouse logbook: serif chapter headings tell the story, mono
instrument panels prove the product is real. Mythology (Argus Panoptes) appears
in one dedicated interlude and ambient naming — never as imagery.

This direction was chosen over a full "neural" treatment (glassmorphism,
animated mesh gradients, violet+cyan duo, shimmer text) because verified
research identifies those exact elements as the documented "AI-generated
landing page" cliché. The differentiator is the combination: editorial serif +
working-instrument detail, which the Instrument-Serif adopter crowd
(Webflow/Framer/Voicenotes tier) does not have.

## Research constraints (binding)

Eye motif:
- ONE geometric eye (existing `ArgusEye` mark): nav, footer, favicon only.
  Never a field of eyes, never inside a triangle, never red, no anatomical
  detail, no blinking or cursor-following (biological motion reads creepy —
  WGN case study).
- "Hundred eyes" exists only in copy.
- Every all-seeing claim sits in the same viewport as a privacy clause
  ("local-first / your machine / your SQLite file").
- Copy verbs: see, observe, catch, notice, keep watch. Never: track, surveil,
  monitor you. The eye watches the system for the user, not the user.

Typography:
- Instrument Serif 400 (+italic) is display-only: never below 24px, never
  faux-bolded, hierarchy via size/italic/color only.
- Exactly one italic value-word per headline. Full-italic headlines banned.
- Serif text `#ededf0` on `#0a0a0c`-range backgrounds (no pure white on pure
  black — stroke bloom). Tracking 0 to −0.01em at display sizes.
- No gradient text, no shimmer, no purple-blue gradient hero.

## Design system

Fonts (bunny.net): `instrument-serif:400,400i` + `inter:400,500,600` +
`jetbrains-mono:400,500,600,700`.

- Serif (Instrument Serif): hero 56–88px clamp, section heads 28–40px,
  myth block 26px, line-height 1.05–1.15.
- Sans (Inter, replaces IBM Plex Sans): body 15–16px, line-height 1.65.
- Mono (JetBrains Mono, unchanged): eyebrows 10px tracked uppercase, feed,
  readouts, code, buttons.

Tokens (revised from current instrument-panel values):

```
--bg-base:    #0a0a0c   (page)
--bg-surface: #101014   (alt sections)
--bg-card:    #16161b   (cards, panels)
--bg-inset:   #0d0d10   (code wells, feed body)
--border:     #26262d
--border-deep:#1e1e24
--accent:     #863bff   (UNCHANGED — brand violet; iris, primary CTA only)
--accent-soft:#a978ff   (italic serif value-word, feed event markers)
--text-primary:#ededf0
--text-muted: #9c9ca6  (and existing dim/ghost ramp, re-tuned to new base)
--text-ok:    #3ecf8e
--font-serif: 'Instrument Serif', Georgia, serif
--font-sans:  'Inter', system-ui, sans-serif
--font-mono:  'JetBrains Mono', ui-monospace, monospace
```

Accent rationing: full-strength `--accent` appears only on the iris and the
primary CTA. The soft tint `--accent-soft` carries the italic value-word,
feed event markers, and the hero glow (at .07 alpha). No cyan anywhere.

Motion (pure CSS, all gated behind `prefers-reduced-motion`):
- Hero atmosphere: one radial violet glow `rgba(134,59,255,.07)` behind the
  feed panel, breathing on a 12s opacity/scale cycle. Concentric iris rings
  retained from current design.
- Feed typing stagger, rec-dot pulse, terminal cursor blink: unchanged
  (cursor is a terminal element, not an eye).
- Scroll reveals: CSS `animation-timeline: view()` where supported,
  `@supports` fallback to the existing `.animate-on-scroll` IntersectionObserver
  contract (hook and class names unchanged).

## Homepage (nine blocks)

1. **Nav** — current structure; `argus_` wordmark, violet iris, GitHub button.
2. **Hero** — serif H1: `The watchman whose eyes *never* all close.`
   ("never" italic, accent-soft). Inter sub: hook control center pitch
   (manage / simulate / script collection) ending with "No cloud. Your
   machine, your SQLite file." Install snippet + View on GitHub (primary) +
   Read docs (secondary). Right column: live feed panel + breathing glow.
   Test contract: h1 present, GitHub link name, INSTALL_CMD exact text node,
   copy button aria-label + `.copied` — all preserved.
3. **Readout strip** — stats bar unchanged (0ms cloud latency / 100% local /
   SQLite / SSE), restyled to new tokens only.
4. **Three pillars** — serif head `Manage. *Test.* Ship.` Three editorial
   columns (typography, hairline separators — not cards): Hook management /
   Hook simulator / Script collection. Each: mono eyebrow, serif 28px head,
   Inter prose (2–3 sentences), arrow link (pillar 1–2 → /features chapters,
   pillar 3 → GitHub folder).
5. **Myth interlude** — full-width quiet block on `--bg-surface`. Serif 26px,
   ≤70 words, self-aware tone. Beats: Argus Panoptes, Hera's watchman, a
   hundred eyes never all closed; peacock coda (his eyes outlived him in the
   peacock's tail — the record outlives the watch); one-line bridge to the
   product. Adjacent mono footnote: "All of it stays on your machine."
   Typography only — no illustration.
6. **Surface tour** — serif head `Six instruments, one panel.` Six
   alternating rows (replaces homepage HowItWorks flow + Features grid):
   Hooks config + simulator (first), Events feed, Sessions waterfall,
   Dashboard & costs, Projects, Diagnostics. Each row: mono panel mock
   (hand-built JSX in the style of current /features panels), serif 28px
   title, Inter copy, 3 bullets.
7. **Quick install** — current tabs/code component; serif section head.
   Test contract (tab names, `.active`, code text) preserved.
8. **Privacy** — serif head `Private by *default*.` Three editorial columns:
   no telemetry / local SQLite / you control exports.
9. **Footer** — current layout + mono ghost one-liner: "watching since the
   bronze age" + MIT license line.

## /features page

One chapter per surface, product-priority order:
1. Hooks config & simulator
2. Script collection (new — links the GitHub `my-custom-hook-scripts/`
   folder; lists each script with a one-line purpose)
3. Events feed
4. Sessions & waterfall
5. Dashboard & costs
6. Projects
7. Diagnostics

Chapter anatomy: mono eyebrow with instrument numbering and a subtle myth
noun (`01 · The guard`, `02 · The armory`, `03 · The record`, `04 · The
timeline`, `05 · The ledger`, `06 · The grounds`, `07 · The pulse` — final
nouns at implementer's discretion, keep them quiet), serif 32px title, Inter
intro, 5 bullets, mono panel mock. Page bottom: signal-chain architecture row
(moved from homepage) + CTA block.

## /install page

Structure and content unchanged. Re-type only: serif page title and section
heads, Inter body, new tokens.

## Implementation notes

Files touched: `src/index.css` (tokens, type system, editorial blocks; keep
every class name currently referenced by tests and the `.animate-on-scroll`
contract), `index.html` (font link), `sections/Hero.tsx`, `sections/
Features.tsx` → replaced by `sections/SurfaceTour.tsx`, `sections/
HowItWorks.tsx` (homepage removal; flow row moves to FeaturesPage),
`sections/Privacy.tsx`, `sections/QuickInstall.tsx`, `sections/Footer.tsx`,
new `sections/MythBlock.tsx`, new `sections/Pillars.tsx`, `pages/
FeaturesPage.tsx`, `pages/InstallPage.tsx`, `App.tsx`.

Existing test contract must pass unmodified: Hero (h1, GitHub link,
INSTALL_CMD, copy/copied), QuickInstall (tabs, active class, code content),
useAnimateOnScroll. New components get co-located tests: MythBlock renders
the interlude text; SurfaceTour renders 6 rows; Pillars renders 3 columns
with links.

Verification: `npx tsc -b --noEmit`, `npx vitest run`, `pnpm build`; deploy
is automatic on push to main (GitHub Actions → Cloudflare Pages).

## Out of scope

No real screenshots pipeline (mocks remain hand-built JSX). No blog. No
light theme. No analytics. No new dependencies (fonts via bunny.net only).
No changes to the main Argus app.
