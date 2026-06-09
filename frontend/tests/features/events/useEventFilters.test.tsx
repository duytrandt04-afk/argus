import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventRecord } from '@/types/events'
import { useEventFilters } from '@/features/events/hooks/useEventFilters'

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    time: new Date().toISOString(),
    action: 'BASH',
    path: '',
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ projects: [] }) })
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useEventFilters — search debounce', () => {
  it('does not filter events before 150ms after searchQuery change', () => {
    const events = [
      makeEvent({ command: 'echo hello' }),
      makeEvent({ command: 'cat file.txt' }),
    ]
    const { result, rerender } = renderHook(
      ({ q }) =>
        useEventFilters(
          events,
          q,
          vi.fn(),
          '',
          '5m',
          vi.fn(),
          '',
          vi.fn(),
          '',
          vi.fn(),
          false
        ),
      { wrapper, initialProps: { q: '' } }
    )

    expect(result.current.filteredEvents).toHaveLength(2)

    rerender({ q: 'hello' })

    // Before debounce expires — still unfiltered
    expect(result.current.filteredEvents).toHaveLength(2)

    // After 150ms — filter applied
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current.filteredEvents).toHaveLength(1)
  })

  it('applies filter when debounce expires', () => {
    const events = [makeEvent({ command: 'grep pattern file' })]
    const { result, rerender } = renderHook(
      ({ q }) =>
        useEventFilters(
          events,
          q,
          vi.fn(),
          '',
          '5m',
          vi.fn(),
          '',
          vi.fn(),
          '',
          vi.fn(),
          false
        ),
      { wrapper, initialProps: { q: '' } }
    )

    rerender({ q: 'nomatch' })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current.filteredEvents).toHaveLength(0)
  })
})
