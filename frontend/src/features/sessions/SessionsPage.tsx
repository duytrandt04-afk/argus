import { useEffect, useMemo, useState } from 'react'
import { useSessionTree } from './hooks/useSessionTree'
import { SessionTree } from './SessionTree'
import { SessionGantt } from './SessionGantt'
import { SessionDetail } from './SessionDetail'
import type { SessionTreeNode } from '@/types/sessions'
import { isRunning } from './utils'

type TimeRangeOption = '24h' | '7d' | '30d' | 'all'

function sinceFromOption(opt: TimeRangeOption): string {
  const now = new Date()
  switch (opt) {
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'all': return '2000-01-01T00:00:00Z'
  }
}

export function SessionsPage() {
  const [timeRangeOpt, setTimeRangeOpt] = useState<TimeRangeOption>('7d')
  const since = useMemo(() => sinceFromOption(timeRangeOpt), [timeRangeOpt])

  const { nodes, loading, sseConnected } = useSessionTree(since)
  const [selectedNode, setSelectedNode] = useState<SessionTreeNode | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const root of nodes) {
        if (!next.has(root.session.session_id)) next.add(root.session.session_id)
      }
      return next
    })
  }, [nodes])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const toggleExpand = (sessionId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  const activeCount = countActiveSessions(nodes, now)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0c0c0c' }}>
      <div style={{ background: '#111', borderBottom: '1px solid var(--app-border)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#ccc', fontWeight: 500 }}>Sessions</span>
        {activeCount > 0 && (
          <span style={{ fontSize: 9, color: '#4ade80', background: '#0a1a0a', border: '1px solid #166534', padding: '1px 6px', borderRadius: 3 }}>
            {activeCount} active
          </span>
        )}
        {sseConnected && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#4ade80' }}>
            <span style={{ width: 5, height: 5, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            live
          </span>
        )}
        <div style={{ flex: 1 }} />
        <select
          value={timeRangeOpt}
          onChange={(e) => setTimeRangeOpt(e.target.value as TimeRangeOption)}
          style={{ background: '#191919', border: '1px solid var(--app-border)', color: '#666', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontFamily: 'inherit' }}
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12 }}>
            Loading…
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 12 }}>
            No sessions found. Start a Claude Code or Codex session.
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <SessionTree
              nodes={nodes}
              expanded={expanded}
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              onToggleExpand={toggleExpand}
              now={now}
            />
            <SessionGantt
              nodes={nodes}
              expanded={expanded}
              selectedNode={selectedNode}
              now={now}
            />
          </div>
        )}
      </div>

      <SessionDetail node={selectedNode} now={now} />
    </div>
  )
}

function countActiveSessions(nodes: SessionTreeNode[], now: number): number {
  let total = 0
  for (const node of nodes) {
    if (isRunning(node.session, now)) {
      total += 1
    }
    if (node.children.length > 0) {
      total += countActiveSessions(node.children, now)
    }
  }
  return total
}
