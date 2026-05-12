import { useCallback, useEffect, useState } from 'react'
import type { SessionTreeNode } from '@/types/sessions'
import type { EventRecord } from '@/types'

export function useSessionTree(since: string) {
  const [nodes, setNodes] = useState<SessionTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sseConnected, setSseConnected] = useState(false)

  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/tree?since=${encodeURIComponent(since)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { sessions: SessionTreeNode[] }
      setNodes(data.sessions ?? [])
      setError(null)
    } catch {
      setError('Failed to load session tree')
    } finally {
      setLoading(false)
    }
  }, [since])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  useEffect(() => {
    const es = new EventSource('/api/events/stream')
    es.onopen = () => setSseConnected(true)
    es.onerror = () => setSseConnected(false)
    es.onmessage = (ev) => {
      try {
        const e = JSON.parse(ev.data as string) as EventRecord
        if (e.hook_event_name === 'SubagentStart' || e.hook_event_name === 'SessionStart') {
          fetchTree()
        }
      } catch { /* ignore parse errors */ }
    }
    return () => es.close()
  }, [fetchTree])

  return { nodes, loading, error, sseConnected }
}
