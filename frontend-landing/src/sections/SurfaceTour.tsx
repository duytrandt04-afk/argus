import { AnimateOnScroll } from '../components/AnimateOnScroll'
import {
  DashboardPanel,
  DiagnosticsPanel,
  EventsFeedPanel,
  HooksConfigPanel,
  ProjectsPanel,
  SessionsPanel,
} from '../components/PanelMocks'

const SURFACES = [
  {
    eyebrow: 'Hooks',
    title: 'Manage and test hooks before agents run them',
    body: 'Presets, a structured editor, and the simulator — fire synthetic payloads at any hook command and read the result without waiting for a live session.',
    bullets: [
      'One-click presets, tagged and reversible',
      'Synthetic payloads for every event type',
      'stdout, stderr, exit code, duration',
    ],
    panel: <HooksConfigPanel />,
  },
  {
    eyebrow: 'Events',
    title: 'Every tool call, the moment it happens',
    body: 'A live feed of normalized events streamed over SSE — sub-100ms from hook to browser.',
    bullets: [
      'Filter by tool, agent, project, time',
      'Expand any event to the raw payload',
      'Permission allow/deny tracked separately',
    ],
    panel: <EventsFeedPanel />,
  },
  {
    eyebrow: 'Sessions',
    title: 'The whole session on one timeline',
    body: 'Tool calls grouped per session and drawn as a waterfall — durations, sequences, bottlenecks at a glance.',
    bullets: [
      'Auto-grouped by working directory + agent',
      'Gantt-style durations side by side',
      'File-change drawer per session',
    ],
    panel: <SessionsPanel />,
  },
  {
    eyebrow: 'Dashboard',
    title: 'Know what your agents spend',
    body: 'Token and cost roll-ups per session, per day, per model — computed locally, no pricing API.',
    bullets: [
      'Input / output / cache token breakdown',
      'Cost estimates for Claude and Codex',
      'Daily and weekly aggregates',
    ],
    panel: <DashboardPanel />,
  },
  {
    eyebrow: 'Projects',
    title: 'Every repo your agents touch',
    body: 'Project cards group sessions by working directory, searchable, with cascade delete when a project retires.',
    bullets: [
      'Session and event counts per project',
      'Client-side search',
      'Delete with full cascade',
    ],
    panel: <ProjectsPanel />,
  },
  {
    eyebrow: 'Diagnostics',
    title: 'The instrument checks itself',
    body: 'Health, storage, hook-script inventory, and log tails — the watcher proves it is awake.',
    bullets: [
      'Backend, DB, and preset status',
      '~/.argus file system inventory',
      'Reveal any file in Finder',
    ],
    panel: <DiagnosticsPanel />,
  },
]

export function SurfaceTour() {
  return (
    <section id="features" className="tour section">
      <div className="container">
        <AnimateOnScroll>
          <p className="section-eyebrow">The instruments</p>
          <h2 className="section-title">Six instruments, one panel.</h2>
        </AnimateOnScroll>
        {SURFACES.map((s, i) => (
          <AnimateOnScroll key={s.eyebrow}>
            <div className={`tour-row${i % 2 === 1 ? ' flip' : ''}`}>
              <div className="tour-copy">
                <p className="section-eyebrow">
                  {String(i + 1).padStart(2, '0')} · {s.eyebrow}
                </p>
                <h3 className="tour-title">{s.title}</h3>
                <p className="tour-body">{s.body}</p>
                <ul className="tour-bullets">
                  {s.bullets.map((b) => (
                    <li key={b}>
                      <span className="t-accent">▸</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>{s.panel}</div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  )
}
