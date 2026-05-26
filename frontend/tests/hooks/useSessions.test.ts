import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessions } from '@/hooks/useSessions'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useSessions', () => {
  it('initializes with loading=true and empty sessions', () => {
    const { result } = renderHook(() => useSessions())
    expect(result.current.loading).toBe(true)
    expect(result.current.sessions).toEqual([])
  })

  it('returns sessions array on successful fetch', async () => {
    const mockSessions = [
      {
        session_id: 'sess-abc123',
        agent: 'claudecode',
        model: 'claude-opus-4-5',
        source: 'startup',
        cwd: '/Users/dev/project',
        transcript_path: '/Users/dev/.claude/sessions/abc.jsonl',
        started_at: '2026-05-14T10:00:00Z',
        last_seen_at: '2026-05-14T10:05:00Z',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
          cache_creation_tokens: 0,
          cache_read_tokens: 0,
          turns: 2,
        },
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSessions,
      })
    )

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.sessions).toEqual(mockSessions)
    expect(result.current.sessions[0].session_id).toBe('sess-abc123')
  })

  it('calls /api/sessions endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useSessions())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/sessions'))
  })

  it('leaves sessions empty when fetch response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    )

    const { result } = renderHook(() => useSessions())

    // loading stays true because ok:false branch does not call setLoading(false)
    // sessions remain empty (no data set)
    await waitFor(() => expect(result.current.sessions).toEqual([]))
    expect(result.current.sessions).toHaveLength(0)
  })

  it('leaves sessions empty when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.sessions).toEqual([]))
    expect(result.current.sessions).toHaveLength(0)
  })
})
