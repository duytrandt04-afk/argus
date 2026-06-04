import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FileChangesDrawer } from '@/features/sessions/FileChangesDrawer'
import type { FileChangeGroup } from '@/types/sessions'

function buildGroup(overrides: Partial<FileChangeGroup> = {}): FileChangeGroup {
  return {
    path: '/src/foo.ts',
    count: 1,
    changes: [
      {
        time: '2026-05-21T10:00:00.000Z',
        tool: 'edit',
        new_string: 'line one\nline two\nline three',
        start_line: 5,
      } as import('@/types/sessions').FileChangeEvent,
    ],
    ...overrides,
  }
}

function renderDrawer(groups: FileChangeGroup[]) {
  return render(
    <FileChangesDrawer
      sessionId="sess-1"
      sessionStartedAt="2026-05-21T10:00:00.000Z"
      groups={groups}
      loading={false}
      error={null}
      onClose={() => {}}
    />
  )
}

describe('FileChangesDrawer ChangeRow expand/collapse', () => {
  function getExpandedCodeBlock() {
    const codeBlock = document.querySelector('pre')
    expect(codeBlock).not.toBeNull()
    return codeBlock as HTMLPreElement
  }

  function expandFirstChange() {
    fireEvent.click(screen.getByText(/foo\.ts/))
    fireEvent.click(screen.getByRole('button', { name: /edit.*\+0s.*L5/i }))
  }

  it('shows a chevron on a ChangeRow that has new_string', () => {
    renderDrawer([buildGroup()])
    // Expand the FileRow first to see ChangeRows
    fireEvent.click(screen.getByText(/foo\.ts/))
    // ChevronRight icon should be present (row is collapsed initially)
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('expands to show line-numbered code when ChangeRow is clicked', () => {
    renderDrawer([buildGroup()])
    expandFirstChange()
    expect(getExpandedCodeBlock().textContent).toContain('5 │ line one')
  })

  it('shows start_line as first line number', () => {
    renderDrawer([buildGroup()])
    expandFirstChange()
    expect(getExpandedCodeBlock().textContent).toContain('5 │ line one')
    expect(getExpandedCodeBlock().textContent).toContain('7 │ line three')
  })

  it('collapses code when ChangeRow is clicked again', () => {
    renderDrawer([buildGroup()])
    fireEvent.click(screen.getByText(/foo\.ts/))
    const changeButton = screen.getByRole('button', { name: /edit.*\+0s.*L5/i })
    fireEvent.click(changeButton)
    expect(getExpandedCodeBlock().textContent).toContain('5 │ line one')
    fireEvent.click(changeButton)
    expect(document.querySelector('pre')).toBeNull()
  })

  it('does not show chevron or expand when new_string and old_string are both absent', () => {
    const group = buildGroup({
      changes: [
        {
          time: '2026-05-21T10:00:00.000Z',
          tool: 'edit',
        } as import('@/types/sessions').FileChangeEvent,
      ],
    })
    renderDrawer([group])
    fireEvent.click(screen.getByText(/foo\.ts/))
    // Should not find any expandable code block
    expect(screen.queryByText(/│/)).toBeNull()
  })
})
