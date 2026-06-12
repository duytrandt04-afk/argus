import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { AnimateOnScroll } from '../components/AnimateOnScroll'
import { Footer } from '../sections/Footer'
import { NavBar } from '../sections/NavBar'

type CodeBlockProps = {
  lang: string
  code: string
  filename?: string
}

function CodeBlock({ lang, code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{filename ?? lang}</span>
        <button
          className={`code-copy-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

type StepProps = {
  num: string
  title: string
  children: React.ReactNode
}

function Step({ num, title, children }: StepProps) {
  return (
    <AnimateOnScroll className="install-step">
      <div className="install-step-header">
        <span className="install-step-num">{num}</span>
        <h3 className="install-step-title">{title}</h3>
      </div>
      <div className="install-step-body">{children}</div>
    </AnimateOnScroll>
  )
}

const INSTALL_CODE = `curl -fsSL https://raw.githubusercontent.com/duytrandt04-afk/argus/main/install.sh | bash`

const START_OUTPUT = `SessionStart hook (completed)
  hook context: ARGUS live @ http://127.0.0.1:10804`

const START_MANUAL = `~/.argus/bin/start-argus.sh`

const SOURCE_CODE = `git clone https://github.com/duytrandt04-afk/argus
cd argus
make build-local
~/.argus/bin/argus`

const CLAUDECODE_HOOKS = `{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{
        "type": "command",
        "command": "curl -s -X POST http://127.0.0.1:10804/api/hook -H 'Content-Type: application/json' -d @-"
      }]
    }],
    "PostToolUse": [{
      "hooks": [{
        "type": "command",
        "command": "curl -s -X POST http://127.0.0.1:10804/api/hook -H 'Content-Type: application/json' -d @-"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "curl -s -X POST http://127.0.0.1:10804/api/hook -H 'Content-Type: application/json' -d @-"
      }]
    }]
  }
}`

const CODEX_HOOKS = `# In your Codex settings or AGENTS.md:
ARGUS_URL=http://127.0.0.1:10804/api/hook

# Add to codex hooks config:
{
  "postToolUse": "curl -s -X POST $ARGUS_URL -H 'Content-Type: application/json' -d @-"
}`

const VERIFY_CODE = `# Check the backend is live
curl -fsS http://127.0.0.1:10804/api/version

# Send a test event manually
echo '{"type":"Stop","session_id":"test"}' \
  | curl -s -X POST http://127.0.0.1:10804/api/hook \
    -H 'Content-Type: application/json' -d @-`

export function InstallPage() {
  return (
    <>
      <NavBar />
      <main>
        {/* Hero */}
        <section className="page-hero">
          <div className="container">
            <AnimateOnScroll>
              <p className="section-eyebrow">Setup</p>
              <h1 className="page-hero-title">Install guide</h1>
              <p className="page-hero-sub">
                First event in under 10 minutes. No accounts. No API keys. No cloud.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={100}>
              <div className="requirements-bar">
                <span className="req-label">Requirements</span>
                <span className="req-item">
                  <span className="t-ok">●</span> Node.js 18+
                </span>
                <span className="req-item">
                  <span className="t-ok">●</span> curl
                </span>
                <span className="req-item">
                  <span className="t-ok">●</span> tar
                </span>
                <span className="req-item">
                  <span className="t-ok">●</span> macOS / Linux / WSL
                </span>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Steps */}
        <section className="section">
          <div className="container install-steps">
            <Step num="01" title="Install with one command">
              <p className="step-desc">
                The installer downloads a pre-built binary for your OS and architecture, places it
                at <code>~/.argus/bin/argus</code>, wires the Claude Code <code>SessionStart</code>{' '}
                hook, and creates <code>start-argus.sh</code>. No Go, no pnpm, no build step.
              </p>
              <CodeBlock lang="bash" code={INSTALL_CODE} />
            </Step>

            <Step num="02" title="Start argus">
              <p className="step-desc">
                Open a new Claude Code or Codex session — argus starts automatically via the{' '}
                <code>SessionStart</code> hook. You will see:
              </p>
              <CodeBlock lang="text" code={START_OUTPUT} filename="session" />
              <p className="step-desc" style={{ marginTop: '12px' }}>
                Or start it manually:
              </p>
              <CodeBlock lang="bash" code={START_MANUAL} />
            </Step>

            <Step num="03" title="Configure agent hooks">
              <p className="step-desc">
                The installer wires Claude Code automatically; add more event types with one-click
                presets on the dashboard&apos;s Hooks Config page. For manual setup, Argus accepts
                any JSON payload via <code>POST /api/hook</code> — it auto-detects the agent from
                the transcript path.
              </p>
              <div className="tabs" style={{ marginBottom: '0' }}>
                <span className="tab-label">Claude Code</span>
              </div>
              <CodeBlock lang="json" filename="~/.claude/settings.json" code={CLAUDECODE_HOOKS} />
              <div className="tabs" style={{ marginTop: '24px', marginBottom: '0' }}>
                <span className="tab-label">Codex</span>
              </div>
              <CodeBlock lang="bash" filename="codex hooks" code={CODEX_HOOKS} />
            </Step>

            <Step num="04" title="Open the dashboard">
              <p className="step-desc">
                Open <strong style={{ color: 'var(--accent)' }}>http://localhost:10804</strong> in
                your browser. Start an agent session — events should appear within milliseconds of
                the first tool call.
              </p>
              <div className="terminal-window" style={{ marginTop: '16px' }}>
                <div className="terminal-chrome">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot amber" />
                  <span className="terminal-dot green" />
                  <span className="terminal-title">localhost:10804 — events</span>
                </div>
                <div className="terminal-body">
                  <div>
                    <span className="t-ok">✓</span>{' '}
                    <span className="t-cmd">SSE stream connected</span>
                  </div>
                  <div>
                    <span className="t-dim">── waiting for events ──</span>
                  </div>
                  <div>&nbsp;</div>
                  <div>
                    <span className="t-accent">▸</span> <span className="t-cmd">PreToolUse</span>{' '}
                    <span className="t-sub">Bash</span>
                  </div>
                  <div>
                    <span className="t-accent">▸</span> <span className="t-cmd">PostToolUse</span>{' '}
                    <span className="t-sub">Bash</span> <span className="t-path">exit:0</span>
                  </div>
                  <div>
                    <span className="t-accent">▸</span> <span className="t-cmd">PostToolUse</span>{' '}
                    <span className="t-sub">Write</span> <span className="t-path">src/App.tsx</span>
                  </div>
                  <div>
                    <span className="t-ok">✓</span> <span className="t-cmd">Stop</span>{' '}
                    <span className="t-dim">agent finished</span>
                  </div>
                </div>
              </div>
            </Step>

            <Step num="05" title="Verify (optional)">
              <p className="step-desc">
                Test the endpoint directly with curl to confirm argus is accepting payloads before
                running a full agent session.
              </p>
              <CodeBlock lang="bash" code={VERIFY_CODE} />
            </Step>

            <Step num="06" title="From source (contributors only)">
              <p className="step-desc">
                Building from source needs Go 1.25+ and pnpm 10.x. <code>make build-local</code>{' '}
                compiles the frontend, embeds the SPA into the Go binary, and installs to{' '}
                <code>~/.argus/bin/</code>. End users never need this.
              </p>
              <CodeBlock lang="bash" code={SOURCE_CODE} />
            </Step>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="section alt-bg">
          <div className="container">
            <AnimateOnScroll>
              <p className="section-eyebrow">Troubleshooting</p>
              <h2 className="section-title">Common issues</h2>
            </AnimateOnScroll>
            <div className="trouble-grid">
              {TROUBLE_ITEMS.map((item, i) => (
                <AnimateOnScroll key={item.problem} delay={i * 60}>
                  <div className="trouble-card">
                    <h4 className="trouble-problem">{item.problem}</h4>
                    <p className="trouble-fix">{item.fix}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section">
          <div className="container" style={{ textAlign: 'center' }}>
            <AnimateOnScroll>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Explore the dashboard
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  marginTop: '12px',
                  marginBottom: '32px',
                }}
              >
                See what the dashboard can show you once events start flowing.
              </p>
              <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                <a href="/features" className="btn-primary">
                  View features
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

const TROUBLE_ITEMS = [
  {
    problem: 'Port 10804 already in use',
    fix: 'Set ADDR=:9000 (or any free port) before running argus. Update the curl commands in your hook config to match.',
  },
  {
    problem: 'Installer fails — curl or tar not found',
    fix: 'Install curl and tar with your system package manager, then re-run the install one-liner.',
  },
  {
    problem: 'Events not appearing in the dashboard',
    fix: 'Confirm argus is running and the curl in your hook config points to the correct port. Send a test payload manually (step 5).',
  },
  {
    problem: 'Argus did not auto-start with my session',
    fix: 'Check the SessionStart hook exists in ~/.claude/settings.json, or start manually: ~/.argus/bin/start-argus.sh.',
  },
  {
    problem: 'Dashboard shows blank / no SSE connection',
    fix: 'Hard-refresh the browser (Cmd+Shift+R). If on WSL, ensure localhost resolves to 127.0.0.1 in your browser.',
  },
  {
    problem: 'Binary not found after install',
    fix: 'Check ~/.argus/bin is in your PATH. Add: export PATH="$HOME/.argus/bin:$PATH" to your shell profile.',
  },
]
