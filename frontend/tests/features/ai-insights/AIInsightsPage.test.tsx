import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AIInsightsPage } from '@/features/ai-insights/AIInsightsPage'

describe('AIInsightsPage', () => {
  it('renders summaries and observations from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summaries: [
            {
              session_id: 'sess-ai',
              agent: 'codex',
              cwd: '/repo/hooker',
              summary: 'Implemented queue retry handling.',
              model: 'claude-sonnet-4-6',
              updated_at: '2026-05-20T10:05:00Z',
            },
          ],
          observations: [
            {
              session_id: 'sess-ai',
              tool_use_id: 'tool-1',
              tool_name: 'Edit',
              observation: 'Updated main.go with retry behavior.',
              model: 'claude-sonnet-4-6',
              event_time: '2026-05-20T10:00:00Z',
              action: 'EDIT',
              path: '/repo/hooker/main.go',
            },
          ],
        }),
      })
    )

    render(
      <MemoryRouter>
        <AIInsightsPage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: /ai insights/i })).toBeInTheDocument()
    expect(screen.getByText('Implemented queue retry handling.')).toBeInTheDocument()
    expect(screen.getAllByText('claude-sonnet-4-6').length).toBeGreaterThan(0)

    const observationsTab = screen.getByRole('tab', { name: /observations/i })
    fireEvent.pointerDown(observationsTab, { button: 0, ctrlKey: false })
    fireEvent.pointerUp(observationsTab)
    fireEvent.click(observationsTab)

    expect(await screen.findByText('Updated main.go with retry behavior.')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: /open sess-ai trace/i })
        .some((link) => link.getAttribute('href') === '/?session=sess-ai&event=tool-1')
    ).toBe(true)

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/ai-insights'))
  })
})
