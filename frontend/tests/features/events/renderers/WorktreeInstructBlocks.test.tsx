import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WorktreeBlock } from '@/features/events/renderers/WorktreeBlock'
import { InstructBlock } from '@/features/events/renderers/InstructBlock'

describe('WorktreeBlock', () => {
  it('renders branch name', () => {
    render(<WorktreeBlock branch="feature/foo" hookEventName="WorktreeCreate" />)
    expect(screen.getByText('feature/foo')).toBeTruthy()
  })

  it('returns null when branch is empty', () => {
    const { container } = render(<WorktreeBlock />)
    expect(container.firstChild).toBeNull()
  })
})

describe('InstructBlock', () => {
  it('renders memory type and load reason', () => {
    render(<InstructBlock memoryType="project" loadReason="startup" searchQuery="" />)
    expect(screen.getByText('project')).toBeTruthy()
    expect(screen.getByText('startup')).toBeTruthy()
  })

  it('returns null when both props are empty', () => {
    const { container } = render(<InstructBlock searchQuery="" />)
    expect(container.firstChild).toBeNull()
  })
})
