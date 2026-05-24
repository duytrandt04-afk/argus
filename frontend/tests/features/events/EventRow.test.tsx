import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EventRow } from '@/features/events/EventRow'
import type { EventRecord } from '@/types/events'

function buildEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    time: '2026-05-21T10:00:00.000Z',
    action: 'BASH',
    path: '',
    command: 'echo hello',
    ...overrides,
  }
}

function createDragStartEvent(target: HTMLElement) {
  const event = new Event('dragstart', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'target', { configurable: true, value: target })
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: {
      effectAllowed: '',
      setData: vi.fn(),
    },
  })
  return event as DragEvent & {
    dataTransfer: {
      effectAllowed: string
      setData: ReturnType<typeof vi.fn>
    }
  }
}

describe('EventRow dragging', () => {
  it('does not start dragging from selectable command content', () => {
    render(<EventRow event={buildEvent()} searchQuery="" isDraggable />)

    const commandText = screen.getByText('echo hello')
    const dragStart = createDragStartEvent(commandText)
    commandText.dispatchEvent(dragStart)

    expect(dragStart.dataTransfer.setData).not.toHaveBeenCalled()
  })

  it('starts dragging from the row outside selectable blocks', () => {
    const { container } = render(<EventRow event={buildEvent()} searchQuery="" isDraggable />)

    expect(container.firstElementChild).toHaveAttribute('draggable', 'true')

    const timeLabel = screen.getByText(/\d{2}:\d{2}:\d{2}/)
    const dragStart = createDragStartEvent(timeLabel)
    timeLabel.dispatchEvent(dragStart)

    expect(dragStart.dataTransfer.setData).toHaveBeenCalledWith(
      'text/plain',
      expect.stringContaining('2026-05-21T10:00:00.000Z')
    )
  })
})
