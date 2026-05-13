import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommandBlock } from '@/features/events/renderers/CommandBlock'
import { StopBlock } from '@/features/events/renderers/StopBlock'
import { ToolResultBlock } from '@/features/events/renderers/ToolResultBlock'

describe('Event renderer copy buttons', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    writeText.mockResolvedValue(undefined)
  })

  afterEach(() => {
    writeText.mockReset()
  })

  it('copies command text', async () => {
    render(<CommandBlock command="echo hello" />)

    fireEvent.click(screen.getByRole('button', { name: /copy command/i }))

    expect(writeText).toHaveBeenCalledWith('echo hello')
  })

  it('copies response text', async () => {
    render(<StopBlock response="assistant response body" />)

    fireEvent.click(screen.getByRole('button', { name: /copy response/i }))

    expect(writeText).toHaveBeenCalledWith('assistant response body')
  })

  it('copies stdout and stderr text', async () => {
    render(<ToolResultBlock stdout="tool output" stderr="tool error" />)

    fireEvent.click(screen.getByRole('button', { name: /copy stdout/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy stderr/i }))

    expect(writeText).toHaveBeenNthCalledWith(1, 'tool output')
    expect(writeText).toHaveBeenNthCalledWith(2, 'tool error')
  })
})
