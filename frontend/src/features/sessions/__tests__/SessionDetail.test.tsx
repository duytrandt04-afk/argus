import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SessionDetail } from '../SessionDetail'
import type { SessionTreeNode } from '@/types/sessions'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const makeNode = (id: string): SessionTreeNode => ({
  session: {
    session_id: id,
    agent: 'claudecode',
    model: 'claude-sonnet-4-5',
    source: '',
    cwd: '/Users/duy/project',
    transcript_path: '',
    started_at: new Date(Date.now() - 300_000).toISOString(),
    last_seen_at: new Date().toISOString(),
    usage: { input_tokens: 0, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0, turns: 0 },
  },
  agent_id: 'agent-abc',
  children: [],
})

describe('SessionDetail', () => {
  it('renders nothing when node is null', () => {
    const { container } = render(
      <MemoryRouter><SessionDetail node={null} now={Date.now()} /></MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows session info', () => {
    render(
      <MemoryRouter><SessionDetail node={makeNode('sess-123')} now={Date.now()} /></MemoryRouter>
    )
    expect(screen.getByText(/claudecode/)).toBeInTheDocument()
    expect(screen.getByText(/\/Users\/duy\/project/)).toBeInTheDocument()
  })

  it('navigates to events page on button click', () => {
    render(
      <MemoryRouter><SessionDetail node={makeNode('sess-xyz')} now={Date.now()} /></MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /view events/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/?session=sess-xyz')
  })
})
