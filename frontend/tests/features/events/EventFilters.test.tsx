import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EventFilters } from '@/features/events/EventFilters'

function renderEventFilters(props: Partial<ComponentProps<typeof EventFilters>> = {}) {
  return render(
    <EventFilters
      actionFilter="all"
      setActionFilter={vi.fn()}
      agentFilter="all"
      setAgentFilter={vi.fn()}
      availableAgents={[]}
      projectFilter="all"
      setProjectFilter={vi.fn()}
      availableProjects={[]}
      sortOrder="newest"
      setSortOrder={vi.fn()}
      timeRange="15m"
      setTimeRange={vi.fn()}
      customStart=""
      setCustomStart={vi.fn()}
      customEnd=""
      setCustomEnd={vi.fn()}
      {...props}
    />
  )
}

describe('EventFilters', () => {
  it('does not render an events search control', () => {
    renderEventFilters()

    expect(screen.queryByRole('textbox', { name: /search events/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /search events/i })).not.toBeInTheDocument()
  })

  it('renders a state-aware split view button', () => {
    const onToggleSplit = vi.fn()
    renderEventFilters({ onToggleSplit })

    const button = screen.getByRole('button', { name: /open split view/i })
    fireEvent.click(button)

    expect(onToggleSplit).toHaveBeenCalledTimes(1)
  })

  it('labels the split view button for closing when split view is active', () => {
    renderEventFilters({ splitView: true, onToggleSplit: vi.fn() })

    expect(screen.getByRole('button', { name: /close split view/i })).toBeInTheDocument()
  })
})
