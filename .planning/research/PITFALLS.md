# v1.1 Diagnostics Research — Pitfalls

## Pitfall 1: Diagnostics Becomes Analytics

Diagnostics should answer health/connectivity/trust questions. If it expands into search, cost analysis, anomaly detection, or comparisons, v1.1 becomes too broad.

**Prevention:** Keep analytics as future requirements. Only include aggregate facts that support install health.

## Pitfall 2: Expensive DB Scans

Diagnostics will be opened repeatedly. Loading recent events and computing everything in memory will become slow as history grows.

**Prevention:** Add targeted SQLite aggregate queries for counts, max timestamps, degraded counts, and per-agent summaries.

## Pitfall 3: Leaking Sensitive Data

Diagnostics touches privacy and raw payload metadata. Showing raw payload snippets, prompt text, tool output, diffs, or full ignored path patterns could violate the product posture.

**Prevention:** Show status, counts, paths already configured by the operator, and warnings. Do not show raw payload content or arbitrary captured text.

## Pitfall 4: Confusing "Configured" with "Working"

Hook files may be present but not actually sending events. Last-seen telemetry may exist even if current config is broken.

**Prevention:** Separate statuses:

- configured/missing/unknown
- last seen
- stale/no events
- degraded payload warnings

## Pitfall 5: Hidden Runtime State in Handler Only

If handler directly reaches into config, filesystem, and repository without a coherent response model, tests become brittle.

**Prevention:** Define an explicit diagnostics domain response and keep handler thin.

## Pitfall 6: False Precision

Some facts cannot be known reliably from the app process, especially external agent hook configuration and GitHub-hosted settings.

**Prevention:** Use `unknown` status where detection is not implemented. Make warnings specific and avoid implying certainty.

## Pitfall 7: Mutating Controls Too Early

Adding "fix hook config", "vacuum DB", or "edit ignore rules" from the UI would require a stronger safety and permission model.

**Prevention:** v1.1 is read-only diagnostics. Mutating maintenance controls belong in a future milestone.

## Pitfall 8: UI Card Sprawl

Diagnostics pages often become scattered cards with duplicated labels and weak hierarchy.

**Prevention:** Use a compact operational layout: one status strip, one system panel, one agent table, one privacy panel. Keep repeated cards only for genuinely repeated agent rows if table layout is not enough on mobile.
