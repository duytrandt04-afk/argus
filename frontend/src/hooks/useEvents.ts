import { useEffect, useState } from 'react'
import type { EventRecord, EventsResponse } from '@/types'

export function useEvents() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) {
          throw new Error(`Failed to fetch events: ${res.status}`)
        }

        const data = (await res.json()) as EventsResponse
        setEvents(data.events ?? [])
        setError(null)
      } catch {
        setError('Failed to fetch events')
      }
    }

    void fetchEvents()
    const interval = window.setInterval(() => {
      void fetchEvents()
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  return { events, error }
}
