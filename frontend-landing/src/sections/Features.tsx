import {
  FlaskConical,
  Package,
  MousePointerClick,
  Lock,
  ChartColumn,
  ChartLine,
} from 'lucide-react'
import { AnimateOnScroll } from '../components/AnimateOnScroll'

function SimulatorIcon() {
  return <FlaskConical size={20} strokeWidth={2} />
}

function CollectionIcon() {
  return <Package size={20} strokeWidth={2} />
}

function PresetIcon() {
  return <MousePointerClick size={20} strokeWidth={2} />
}

function PadlockIcon() {
  return <Lock size={20} strokeWidth={2} />
}

function BarChartIcon() {
  return <ChartColumn size={20} strokeWidth={2} />
}

function LineChartIcon() {
  return <ChartLine size={20} strokeWidth={2} />
}

const CARDS = [
  {
    variant: 'v1',
    icon: <SimulatorIcon />,
    title: 'Hook simulator',
    desc: 'Run any hook command against a synthetic payload — stdout, stderr, exit code — before a live agent ever fires it.',
  },
  {
    variant: 'v1',
    icon: <CollectionIcon />,
    title: 'Script collection',
    desc: 'Free, zero-dependency guardrails: dangerous-command blocker, secrets protection, branch guard, auto-format, injection scanner.',
  },
  {
    variant: 'v2',
    icon: <PresetIcon />,
    title: 'One-click presets',
    desc: 'Wire Claude Code or Codex hooks from the dashboard. Tagged, additive, reversible — no JSON surgery.',
  },
  {
    variant: 'v2',
    icon: <PadlockIcon />,
    title: 'Zero cloud',
    desc: 'Everything runs on localhost. No accounts, no API keys, no telemetry ever leaves your machine.',
  },
  {
    variant: 'v3',
    icon: <BarChartIcon />,
    title: 'Waterfall view',
    desc: 'See the full timeline of tool calls, durations, and tool sequences in one glance.',
  },
  {
    variant: 'v3',
    icon: <LineChartIcon />,
    title: 'Stats & costs',
    desc: 'Token usage, cost estimates, and tool-call frequency charts out of the box.',
  },
]

export function Features() {
  return (
    <section id="features" className="features section">
      <div className="container">
        <AnimateOnScroll>
          <p className="section-eyebrow">02 · Capabilities</p>
          <h2 className="section-title">Manage, test, and watch your hooks</h2>
        </AnimateOnScroll>
        <div className="features-grid">
          {CARDS.map((card, i) => (
            <AnimateOnScroll key={card.title} delay={i * 60}>
              <div className={`feature-card ${card.variant}`}>
                <div className="feature-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
