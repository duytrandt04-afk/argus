import { AnimateOnScroll } from '../components/AnimateOnScroll'
import {
  DashboardPanel,
  EventsFeedPanel,
  HooksConfigPanel,
  SessionsPanel,
} from '../components/PanelMocks'
import { Footer } from '../sections/Footer'
import { NavBar } from '../sections/NavBar'

type FeatureDetail = {
  eyebrow: string
  title: string
  desc: string
  bullets: string[]
  panel: React.ReactNode
  flip?: boolean
}

const FEATURES: FeatureDetail[] = [
  {
    eyebrow: 'Hooks config & simulator',
    title: 'Manage & test hooks\nbefore agents run them',
    desc: 'The core of Argus: one-click hook presets, a structured config editor, and a simulator that fires synthetic payloads at any hook command — plus a free public collection of battle-tested guardrail scripts.',
    bullets: [
      'One-click presets for Claude Code and Codex — tagged, additive, reversible',
      'Simulator runs any hook against a realistic payload for every event type',
      'Inspect stdout, stderr, exit code, and duration without a live agent',
      'Public script collection: command blocker, secrets guard, branch protection, auto-format, injection scanner',
      'Structured JSON editor with live validation',
    ],
    panel: <HooksConfigPanel />,
  },
  {
    eyebrow: 'Live event feed',
    title: 'Every tool call,\nin real time',
    desc: 'Argus streams every agent action to your browser the instant it fires. No polling. No refresh.',
    bullets: [
      'SSE stream — sub-100ms latency from hook to browser',
      'Filter by tool type, agent, project, or time range',
      'Expand any event to inspect the raw payload',
      'Persisted search and filter state across navigation',
      'Permission events (allow / deny) tracked separately',
    ],
    panel: <EventsFeedPanel />,
    flip: true,
  },
  {
    eyebrow: 'Session waterfall',
    title: 'See the full\ntimeline at a glance',
    desc: 'Group events into sessions and visualise tool-call sequences as a waterfall. Instantly spot bottlenecks.',
    bullets: [
      'Auto-groups events by working directory + agent',
      'Gantt-style waterfall shows tool durations side-by-side',
      'File-change drawer lists every modified path per session',
      'Multi-agent sessions tracked independently',
      'Session state persists across page reloads',
    ],
    panel: <SessionsPanel />,
  },
  {
    eyebrow: 'Dashboard & costs',
    title: 'Token usage\n& cost estimates',
    desc: 'Know exactly what your agents are spending — per session, per day, per model.',
    bullets: [
      'Input / output / cache token breakdown per session',
      'Cost estimates for Claude and Codex models',
      'Daily and weekly aggregates on the dashboard',
      'Charts powered by Recharts — no cloud analytics',
      'All math runs locally — no external pricing API',
    ],
    panel: <DashboardPanel />,
    flip: true,
  },
]

export function FeaturesPage() {
  return (
    <>
      <NavBar />
      <main>
        {/* Hero */}
        <section className="page-hero">
          <div className="container">
            <AnimateOnScroll>
              <p className="section-eyebrow">Capabilities</p>
              <h1 className="page-hero-title">Features</h1>
              <p className="page-hero-sub">
                Everything you need to govern, test, and observe your AI coding agents — running
                entirely on localhost.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Feature rows */}
        {FEATURES.map((f, i) => (
          <section key={f.eyebrow} className={`feature-row section${i % 2 === 1 ? ' alt-bg' : ''}`}>
            <div className="container">
              <div className={`feature-row-inner${f.flip ? ' flip' : ''}`}>
                <AnimateOnScroll className="feature-row-copy">
                  <p className="section-eyebrow">{f.eyebrow}</p>
                  <h2 className="feature-row-title">
                    {f.title.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j === 0 ? <br /> : null}
                      </span>
                    ))}
                  </h2>
                  <p className="feature-row-desc">{f.desc}</p>
                  <ul className="feature-row-bullets">
                    {f.bullets.map((b) => (
                      <li key={b}>
                        <span className="t-accent">▸</span> {b}
                      </li>
                    ))}
                  </ul>
                </AnimateOnScroll>
                <AnimateOnScroll delay={120}>{f.panel}</AnimateOnScroll>
              </div>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="section">
          <div className="container" style={{ textAlign: 'center' }}>
            <AnimateOnScroll>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Ready to start?
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  marginTop: '12px',
                  marginBottom: '32px',
                }}
              >
                Clone, build, and have your first event in under 10 minutes.
              </p>
              <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                <a href="/install" className="btn-primary">
                  Install guide
                </a>
                <a
                  href="https://github.com/duytrandt04-afk/argus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  GitHub ↗
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
