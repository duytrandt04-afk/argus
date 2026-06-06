import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventsPage } from '@/features/events/EventsPage'
import type { LayoutOutletContext } from '@/types'

const refreshSessionUsage = vi.fn()
const setActionFilter = vi.fn()
const setAgentFilter = vi.fn()
const setProjectFilter = vi.fn()
const histRefresh = vi.fn()
const refreshProjects = vi.fn()
const setSearchParams = vi.fn()
const clearLink = vi.fn()
const toggleSession = vi.fn()
const setIsLive = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () =>
      ({
        collapsedSessions: new Set<string>(),
        setCollapsedSessions: vi.fn(),
        sessionUsage: {},
        searchQuery: '',
        setSearchQuery: vi.fn(),
        isLive: false,
        setIsLive,
        refreshSessionUsage,
      }) as LayoutOutletContext,
  }
})

vi.mock('@/features/events/EventFilters', () => ({
  EventFilters: ({ onRefresh }: { onRefresh?: () => void }) => (
    <button type="button" onClick={onRefresh}>
      refresh
    </button>
  ),
}))

vi.mock('@/features/events/hooks/useEventLinkState', () => ({
  useEventLinkState: () => ({
    clearLink,
    eventLink: { pendingEventLink: null, highlightedEventKey: null },
    sessionFilterOverride: '',
    setSearchParams,
    toggleSession,
    urlSession: '',
  }),
}))

vi.mock('@/features/events/hooks/useEventsTimeRangeState', () => ({
  useEventsTimeRangeState: () => ({
    timeRange: '15m',
    setTimeRange: vi.fn(),
    customStart: '',
    setCustomStart: vi.fn(),
    customEnd: '',
    setCustomEnd: vi.fn(),
    fetchSince: '',
    fetchUntil: '',
  }),
}))

vi.mock('@/features/events/hooks/useLiveEvents', () => ({
  useLiveEvents: () => ({ events: [], error: null }),
}))

vi.mock('@/features/events/hooks/useHistoricalEvents', () => ({
  useHistoricalEvents: () => ({
    events: [],
    hasMore: false,
    loading: false,
    error: null,
    loadMore: vi.fn(),
    refresh: histRefresh,
  }),
}))

vi.mock('@/features/events/hooks/useEventFilters', () => ({
  useEventFilters: () => ({
    actionFilter: 'EDIT',
    setActionFilter,
    agentFilter: 'claudecode',
    setAgentFilter,
    availableAgents: ['claudecode'],
    projectFilter: '/tmp/project',
    setProjectFilter,
    availableProjects: ['/tmp/project'],
    sortOrder: 'newest',
    setSortOrder: vi.fn(),
    filteredEvents: [],
    refreshProjects,
  }),
}))

vi.mock('@/features/events/hooks/useEventsPageInteractions', () => ({
  useEventLinkState: () => ({
    clearLink,
    eventLink: { pendingEventLink: null, highlightedEventKey: null },
    sessionFilterOverride: '',
    setSearchParams,
    toggleSession,
    urlSession: '',
  }),
  useSplitViewInteractions: () => ({
    dragOverPanel: null,
    edgeZoneHover: false,
    handleDragLeave: vi.fn(),
    handleDragOver: vi.fn(),
    handleDropToEdge: vi.fn(),
    handleDropToPanel: vi.fn(),
    isDragging: false,
    panel1Events: [],
    panel2Events: [],
    setEdgeZoneHover: vi.fn(),
    splitView: false,
    toggleSplitView: vi.fn(),
  }),
}))

describe('EventsPage refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resets action, agent, and project filters before refresh', () => {
    render(<EventsPage />)

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))

    expect(setActionFilter).toHaveBeenCalledWith('all')
    expect(setAgentFilter).toHaveBeenCalledWith('all')
    expect(setProjectFilter).toHaveBeenCalledWith('all')
    expect(histRefresh).toHaveBeenCalledTimes(1)
    expect(refreshSessionUsage).toHaveBeenCalledTimes(1)
    expect(refreshProjects).toHaveBeenCalledTimes(1)
  })
})
