const ITEMS = [
  { tag: 'PreToolUse', text: 'block-dangerous.js · rm -rf ~ → deny' },
  { tag: '0ms', text: 'cloud latency' },
  { tag: 'PostToolUse', text: 'format-lint.js · 0 errors' },
  { tag: 'SQLite', text: 'no external deps' },
  { tag: 'PreToolUse', text: 'protect-branch.js · push to main → deny' },
  { tag: '100%', text: 'local storage' },
  { tag: 'WebFetch', text: 'scan-injection.js · clean' },
  { tag: 'SSE', text: 'sub-100ms hook → browser' },
  { tag: 'Stop', text: 'notify-webhook.js · slack ✓' },
  { tag: 'simulator', text: 'synthetic payload · exit 0 · 12ms' },
]

// Full-width infinite marquee: the track renders twice and slides -50%,
// so the loop is seamless. Paused on hover; static under reduced motion.
export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div className="ticker-group" key={copy}>
            {ITEMS.map((item) => (
              <span className="ticker-item" key={`${copy}-${item.tag}-${item.text}`}>
                <span className="ticker-tag">{item.tag}</span>
                <span className="ticker-text">{item.text}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
