import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TokenUsagePanel } from '@/features/dashboard/TokenUsagePanel'
import type { DashboardStats } from '@/features/dashboard/hooks/useDashboardStats'

vi.mock('@/features/dashboard/TokenUsageChart', () => ({
  TokenUsageChart: () => <div>token-usage-chart</div>,
}))

vi.mock('@/features/dashboard/TokenTimelineChart', () => ({
  TokenTimelineChart: () => <div>token-timeline-chart</div>,
}))

vi.mock('@/features/dashboard/SessionsTable', () => ({
  SessionsTable: () => <div>sessions-table</div>,
}))

function makeStats(): DashboardStats {
  return {
    total_sessions: 0,
    total_events: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    timeline_granularity: 'day',
    timeline: [],
    timeline_by_agent: [],
    token_timeline: [],
    token_timeline_by_agent: [],
    top_actions: [],
    agent_usage: [],
    session_usage: [],
  }
}

describe('TokenUsagePanel', () => {
  it('does not render group-by controls', () => {
    render(<TokenUsagePanel stats={makeStats()} />)

    expect(screen.queryByText(/group by/i)).not.toBeInTheDocument()
    expect(screen.getByText('token-timeline-chart')).toBeInTheDocument()
    expect(screen.getByText('token-usage-chart')).toBeInTheDocument()
    expect(screen.getByText('sessions-table')).toBeInTheDocument()
  })
})
