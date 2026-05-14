import { useCallback, useEffect, useState } from 'react'
import type { EventRecord } from '@/types/events'

export interface TraceSpan {
  id: string
  name: string
  type: string
  startTime: number
  endTime: number
  duration: number
  parent_id?: string
  children: TraceSpan[]
  event: EventRecord
}

export function useTraces(since: string) {
  const [traces, setTraces] = useState<TraceSpan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTraces = useCallback(async () => {
    try {
      const res = await fetch(`/api/traces`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { traces: EventRecord[] }
      
      const rawEvents = data.traces || []
      
      // Group by subagent_id to form spans. 
      // An execution might have multiple events (start, tool use, end).
      // We need to determine start time, end time, parent-child.
      const spanMap = new Map<string, TraceSpan>()
      
      for (const e of rawEvents) {
        if (!e.subagent_id) continue
        
        const time = new Date(e.time).getTime()
        
        if (!spanMap.has(e.subagent_id)) {
          spanMap.set(e.subagent_id, {
            id: e.subagent_id,
            name: e.task_title || e.tool || e.hook_event_name || 'Span',
            type: e.subagent_type || 'unknown',
            startTime: time,
            endTime: time,
            duration: 0,
            children: [],
            event: e,
            parent_id: e.turn_id || undefined // Use turn_id or session as parent heuristic if no explicit parent
          })
        }
        
        const span = spanMap.get(e.subagent_id)!
        if (time < span.startTime) span.startTime = time
        if (time > span.endTime) span.endTime = time
        
        // Account for explicit duration from the backend
        if (e.duration_ms && e.duration_ms > 0) {
          const expectedEndTime = time + e.duration_ms
          if (expectedEndTime > span.endTime) {
            span.endTime = expectedEndTime
          }
        }
        
        span.duration = span.endTime - span.startTime
        
        // Update name if better info is available
        if (e.task_title && span.name === 'Span') span.name = e.task_title
        if (e.tool && span.name === 'Span') span.name = e.tool
      }
      
      // Sort spans by start time
      const sortedSpans = Array.from(spanMap.values()).sort((a, b) => a.startTime - b.startTime)
      
      const roots: TraceSpan[] = []
      
      // Heuristic: if span B starts after span A and ends before span A, it is a child.
      // We maintain a stack of active spans to find the parent.
      const activeStack: TraceSpan[] = []
      
      for (const span of sortedSpans) {
        // Remove spans from stack that have already ended
        while (activeStack.length > 0 && activeStack[activeStack.length - 1].endTime < span.startTime) {
          activeStack.pop()
        }
        
        if (activeStack.length > 0) {
          // The current top of the stack is the parent
          const parent = activeStack[activeStack.length - 1]
          span.parent_id = parent.id
          parent.children.push(span)
        } else {
          // No parent, this is a root
          roots.push(span)
        }
        
        // Push this span to the stack
        activeStack.push(span)
      }
      
      setTraces(roots)
      setError(null)
    } catch {
      setError('Failed to load traces')
    } finally {
      setLoading(false)
    }
  }, [since])

  useEffect(() => {
    fetchTraces()
  }, [fetchTraces])

  useEffect(() => {
    const es = new EventSource('/api/events/stream')
    es.onmessage = (ev) => {
      try {
        const e = JSON.parse(ev.data as string) as EventRecord
        if (e.subagent_id) {
          fetchTraces()
        }
      } catch { /* ignore parse errors */ }
    }
    return () => es.close()
  }, [fetchTraces])

  return { traces, loading, error }
}
