import type { Session, SessionTreeNode } from '@/types/sessions'

export interface FlatRow {
  node: SessionTreeNode
  depth: number
  isRoot: boolean
  rootNode: SessionTreeNode
}

export function flattenTree(nodes: SessionTreeNode[], expanded: Set<string>): FlatRow[] {
  const rows: FlatRow[] = []

  function walk(list: SessionTreeNode[], depth: number, root: SessionTreeNode) {
    for (const node of list) {
      rows.push({ node, depth, isRoot: depth === 0, rootNode: root })
      if (expanded.has(node.session.session_id) && node.children.length > 0) {
        walk(node.children, depth + 1, depth === 0 ? node : root)
      }
    }
  }

  for (const root of nodes) {
    walk([root], 0, root)
  }

  return rows
}

export function isRunning(session: Session, now: number): boolean {
  return now - new Date(session.last_seen_at).getTime() < 10_000
}

export function sessionDurationMs(session: Session, now: number): number {
  const start = new Date(session.started_at).getTime()
  const end = isRunning(session, now) ? now : new Date(session.last_seen_at).getTime()
  return Math.max(0, end - start)
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return '<1s'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

export function formatTimeAxis(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function agentColor(agent: string): string {
  switch (agent) {
    case 'claudecode': return 'var(--brand)'
    case 'codex': return 'var(--dim)'
    default: return 'var(--agent)'
  }
}

export function barColor(agent: string, running: boolean): string {
  if (running) return '#16a34a'
  switch (agent) {
    case 'claudecode': return '#7c3aed'
    default: return '#1d4ed8'
  }
}
