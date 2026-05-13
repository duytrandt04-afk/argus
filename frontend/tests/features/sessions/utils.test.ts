import { describe, expect, it } from 'vitest'
import type { Session } from '@/types/sessions'
import { isRunning, sessionDurationMs } from '@/features/sessions/utils'

const NOW = new Date('2026-05-13T12:00:00Z').getTime()

function session(overrides: Partial<Session> = {}): Session {
  return {
    session_id: 's1',
    agent: 'codex',
    model: 'gpt-5.4',
    source: 'startup',
    cwd: '/tmp',
    transcript_path: '/tmp/a',
    started_at: '2026-05-13T11:59:00Z',
    last_seen_at: '2026-05-13T11:59:58Z',
    usage: {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
      turns: 0,
    },
    ...overrides,
  }
}

describe('sessions utils', () => {
  it('sessionDurationMs returns 0 for invalid started_at', () => {
    const ms = sessionDurationMs(session({ started_at: '' }), NOW)
    expect(ms).toBe(0)
  })

  it('sessionDurationMs returns 0 for invalid last_seen_at on finished sessions', () => {
    const ms = sessionDurationMs(
      session({
        started_at: '2026-05-13T11:00:00Z',
        last_seen_at: '',
      }),
      NOW
    )
    expect(ms).toBe(0)
  })

  it('isRunning returns false for invalid last_seen_at', () => {
    expect(isRunning(session({ last_seen_at: '' }), NOW)).toBe(false)
  })

  it('isRunning returns false when ended_at exists even if last_seen is recent', () => {
    expect(
      isRunning(
        session({
          last_seen_at: '2026-05-13T11:59:59Z',
          ended_at: '2026-05-13T11:59:59Z',
        }),
        NOW
      )
    ).toBe(false)
  })

  it('sessionDurationMs ends at ended_at when present', () => {
    const ms = sessionDurationMs(
      session({
        started_at: '2026-05-13T11:00:00Z',
        last_seen_at: '2026-05-13T12:30:00Z',
        ended_at: '2026-05-13T11:30:00Z',
      }),
      NOW
    )
    expect(ms).toBe(30 * 60 * 1000)
  })
})
