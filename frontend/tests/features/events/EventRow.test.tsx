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

describe('EventRow raw payload button', () => {
  it('shows raw payload button when dedup_key is present', () => {
    render(<EventRow event={buildEvent({ dedup_key: 'abc123' })} searchQuery="" />)
    expect(screen.getByRole('button', { name: /raw payload/i })).toBeTruthy()
  })

  it('does not show raw payload button when dedup_key is absent', () => {
    render(<EventRow event={buildEvent()} searchQuery="" />)
    expect(screen.queryByRole('button', { name: /raw payload/i })).toBeNull()
  })
})

describe('EventRow description display', () => {
  it('shows Intent label when description is set', () => {
    render(
      <EventRow
        event={buildEvent({ action: 'BASH', command: 'ls -la', description: 'List project files' })}
        searchQuery=""
      />
    )
    expect(screen.getByText('Intent:')).toBeTruthy()
    expect(screen.getByText('List project files')).toBeTruthy()
  })

  it('does not show Intent label when description is absent', () => {
    render(<EventRow event={buildEvent({ action: 'BASH', command: 'ls -la' })} searchQuery="" />)
    expect(screen.queryByText('Intent:')).toBeNull()
  })
})

describe('EventRow PermissionBlock', () => {
  it('renders AskUserQuestion card with question text and options', () => {
    const questionsJson = JSON.stringify([
      {
        question: 'What do you mean?',
        header: 'Clarify issue',
        multiSelect: false,
        options: [
          { label: 'Old session', description: 'Session is from hours ago' },
          { label: 'Session ended', description: 'Session finished recently' },
        ],
      },
    ])
    render(
      <EventRow
        event={buildEvent({
          action: 'PERMISSION',
          tool: 'AskUserQuestion',
          tool_input_questions_json: questionsJson,
        })}
        searchQuery=""
      />
    )
    expect(screen.getByText('Clarify issue')).toBeTruthy()
    expect(screen.getByText('What do you mean?')).toBeTruthy()
    expect(screen.getByText('Old session')).toBeTruthy()
    expect(screen.getByText('Session ended')).toBeTruthy()
  })

  it('renders permission suggestion chip with allow behavior', () => {
    const suggestionsJson = JSON.stringify([
      {
        type: 'addRules',
        rules: [{ toolName: 'Bash', ruleContent: 'xargs cat' }],
        behavior: 'allow',
        destination: 'localSettings',
      },
    ])
    render(
      <EventRow
        event={buildEvent({
          action: 'PERMISSION',
          tool: 'Bash',
          permission_suggestions_json: suggestionsJson,
        })}
        searchQuery=""
      />
    )
    expect(screen.getByText('allow')).toBeTruthy()
    expect(screen.getByText(/"xargs cat" → localSettings/)).toBeTruthy()
  })

  it('renders no question card or suggestion chip for PERMISSION event with empty data', () => {
    render(
      <EventRow
        event={buildEvent({
          action: 'PERMISSION',
          tool: 'Bash',
        })}
        searchQuery=""
      />
    )
    expect(screen.queryByText('allow')).toBeNull()
    expect(screen.queryByText('deny')).toBeNull()
    expect(screen.queryByText('○')).toBeNull()
    expect(screen.queryByText('□')).toBeNull()
  })
})
