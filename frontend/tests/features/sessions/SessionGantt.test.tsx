import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SessionGantt } from '@/features/sessions/SessionGantt'
import type { SessionTreeNode } from '@/types/sessions'

const t = (offsetMs: number) => new Date(1_700_000_000_000 + offsetMs).toISOString()

const makeNode = (id: string, startOffset: number, endOffset: number, children: SessionTreeNode[] = []): SessionTreeNode => ({
  session: {
    session_id: id,
    agent: 'claudecode',
    model: '',
    source: '',
    cwd: '',
    transcript_path: '',
    started_at: t(startOffset),
    last_seen_at: t(endOffset),
    usage: { input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, turns: 0 },
  },
  children,
})

describe('SessionGantt', () => {
  it('renders a bar for each visible row', () => {
    const root = makeNode('root', 0, 8 * 60_000, [
      makeNode('child1', 0, 2 * 60_000),
    ])
    const { container } = render(
      <SessionGantt
        nodes={[root]}
        expanded={new Set(['root'])}
        selectedNode={null}
        now={1_700_000_000_000 + 8 * 60_000}
      />
    )
    const bars = container.querySelectorAll('[data-testid="gantt-bar"]')
    expect(bars.length).toBe(2)
  })

  it('root bar spans full width', () => {
    const root = makeNode('root', 0, 60_000)
    const { container } = render(
      <SessionGantt
        nodes={[root]}
        expanded={new Set()}
        selectedNode={null}
        now={1_700_000_000_000 + 60_000}
      />
    )
    const bar = container.querySelector('[data-testid="gantt-bar"]') as HTMLElement
    expect(bar.style.width).toBe('100%')
    expect(bar.style.left).toBe('0%')
  })

  it('running bar has non-zero width', () => {
    const now = Date.now()
    const root: SessionTreeNode = {
      session: {
        session_id: 'root',
        agent: 'claudecode',
        model: '',
        source: '',
        cwd: '',
        transcript_path: '',
        started_at: new Date(now - 5_000).toISOString(),
        last_seen_at: new Date(now - 500).toISOString(),
        usage: { input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, turns: 0 },
      },
      children: [],
    }
    const { container } = render(
      <SessionGantt
        nodes={[root]}
        expanded={new Set()}
        selectedNode={null}
        now={now}
      />
    )
    const bar = container.querySelector('[data-testid="gantt-bar"]') as HTMLElement
    const width = parseFloat(bar.style.width)
    expect(width).toBeGreaterThan(0)
  })
})
