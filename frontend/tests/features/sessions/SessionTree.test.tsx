import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SessionTree } from '@/features/sessions/SessionTree'
import type { SessionTreeNode } from '@/types/sessions'

const makeNode = (id: string, children: SessionTreeNode[] = []): SessionTreeNode => ({
  session: {
    session_id: id,
    agent: 'claudecode',
    model: 'claude-sonnet',
    source: '',
    cwd: '/tmp',
    transcript_path: '',
    started_at: new Date(Date.now() - 60_000).toISOString(),
    last_seen_at: new Date().toISOString(),
    usage: { input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, turns: 0 },
  },
  children,
})

describe('SessionTree', () => {
  it('renders root session row', () => {
    const nodes = [makeNode('root1')]
    render(
      <SessionTree
        nodes={nodes}
        expanded={new Set(['root1'])}
        selectedNode={null}
        onSelect={vi.fn()}
        onToggleExpand={vi.fn()}
        now={Date.now()}
      />
    )
    expect(screen.getByText(/root1/)).toBeInTheDocument()
  })

  it('renders children when expanded', () => {
    const nodes = [makeNode('root1', [makeNode('child1')])]
    render(
      <SessionTree
        nodes={nodes}
        expanded={new Set(['root1'])}
        selectedNode={null}
        onSelect={vi.fn()}
        onToggleExpand={vi.fn()}
        now={Date.now()}
      />
    )
    expect(screen.getByText(/child1/)).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    const nodes = [makeNode('root1', [makeNode('child1')])]
    render(
      <SessionTree
        nodes={nodes}
        expanded={new Set()}
        selectedNode={null}
        onSelect={vi.fn()}
        onToggleExpand={vi.fn()}
        now={Date.now()}
      />
    )
    expect(screen.queryByText(/child1/)).not.toBeInTheDocument()
  })

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn()
    const nodes = [makeNode('root1')]
    render(
      <SessionTree
        nodes={nodes}
        expanded={new Set()}
        selectedNode={null}
        onSelect={onSelect}
        onToggleExpand={vi.fn()}
        now={Date.now()}
      />
    )
    fireEvent.click(screen.getByText(/root1/))
    expect(onSelect).toHaveBeenCalledWith(nodes[0])
  })

  it('calls onToggleExpand when expand icon clicked', () => {
    const onToggle = vi.fn()
    const nodes = [makeNode('root1', [makeNode('child1')])]
    render(
      <SessionTree
        nodes={nodes}
        expanded={new Set()}
        selectedNode={null}
        onSelect={vi.fn()}
        onToggleExpand={onToggle}
        now={Date.now()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /expand/i }))
    expect(onToggle).toHaveBeenCalledWith('root1')
  })
})
