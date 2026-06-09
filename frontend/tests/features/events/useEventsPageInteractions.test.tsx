import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useSplitViewInteractions } from '@/features/events/hooks/useEventsPageInteractions'

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

function makeDragEvent(): React.DragEvent {
  return {
    preventDefault: () => {},
    dataTransfer: { dropEffect: '' as DataTransfer['dropEffect'] },
  } as unknown as React.DragEvent
}

describe('useSplitViewInteractions — handleDragOver', () => {
  it('sets dragOverPanel on first call', () => {
    const { result } = renderHook(
      () => useSplitViewInteractions({ filteredEvents: [], sortOrder: 'newest' }),
      { wrapper }
    )
    act(() => {
      result.current.handleDragOver(1)(makeDragEvent())
    })
    expect(result.current.dragOverPanel).toBe(1)
  })

  it('updates dragOverPanel when called with a different panel', () => {
    const { result } = renderHook(
      () => useSplitViewInteractions({ filteredEvents: [], sortOrder: 'newest' }),
      { wrapper }
    )
    act(() => {
      result.current.handleDragOver(1)(makeDragEvent())
    })
    act(() => {
      result.current.handleDragOver(2)(makeDragEvent())
    })
    expect(result.current.dragOverPanel).toBe(2)
  })

  it('dragOverPanel stays unchanged when called repeatedly with same panel', () => {
    const { result } = renderHook(
      () => useSplitViewInteractions({ filteredEvents: [], sortOrder: 'newest' }),
      { wrapper }
    )
    act(() => {
      result.current.handleDragOver(1)(makeDragEvent())
    })
    act(() => {
      result.current.handleDragOver(1)(makeDragEvent())
    })
    expect(result.current.dragOverPanel).toBe(1)
  })
})

describe('useSplitViewInteractions — handleDragLeave', () => {
  it('clears dragOverPanel', () => {
    const { result } = renderHook(
      () => useSplitViewInteractions({ filteredEvents: [], sortOrder: 'newest' }),
      { wrapper }
    )
    act(() => {
      result.current.handleDragOver(1)(makeDragEvent())
    })
    act(() => {
      result.current.handleDragLeave({
        currentTarget: document.createElement('div'),
        relatedTarget: null,
      } as unknown as React.DragEvent)
    })
    expect(result.current.dragOverPanel).toBeNull()
  })
})
