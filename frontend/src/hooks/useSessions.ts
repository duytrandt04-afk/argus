import { useEffect, useState } from 'react'
import type { Session } from '@/types/sessions'

export type { Session }

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions')
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setSessions(data)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Failed to fetch sessions', err)
      }
    }

    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { sessions, loading }
}
