import { cn } from '@/lib/utils'
import type { SessionTreeNode } from '@/types/sessions'
import { agentColor, flattenTree, formatDuration, isRunning, sessionDurationMs } from './utils'

interface Props {
  nodes: SessionTreeNode[]
  expanded: Set<string>
  selectedNode: SessionTreeNode | null
  onSelect: (node: SessionTreeNode) => void
  onToggleExpand: (sessionId: string) => void
  now: number
}

const ROW_HEIGHT_ROOT = 44
const ROW_HEIGHT_CHILD = 36

export function SessionTree({ nodes, expanded, selectedNode, onSelect, onToggleExpand, now }: Props) {
  const rows = flattenTree(nodes, expanded)

  return (
    <div className={cn('flex flex-col overflow-y-auto')} style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--app-border)' }}>
      <div style={{ height: 28, background: '#111', borderBottom: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agent / Session</span>
      </div>

      {rows.map((row, index) => {
        const { node, depth, isRoot } = row
        const sess = node.session
        const selected = selectedNode?.session.session_id === sess.session_id
        const running = isRunning(sess, now)
        const duration = sessionDurationMs(sess, now)
        const hasChildren = node.children.length > 0
        const isExpanded = expanded.has(sess.session_id)
        const height = isRoot ? ROW_HEIGHT_ROOT : ROW_HEIGHT_CHILD
        const rowKey = sess.session_id || node.agent_id || `${row.rootNode.session.session_id || 'root'}-${index}`

        return (
          <div
            key={rowKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height,
              paddingLeft: depth === 0 ? 10 : 10 + depth * 16,
              paddingRight: 10,
              borderBottom: '1px solid #1a1a1a',
              background: selected ? '#1a1428' : isRoot ? '#191919' : '#111',
              borderLeft: selected ? '2px solid var(--brand)' : undefined,
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
            }}
            onClick={() => onSelect(node)}
          >
            {depth > 0 && (
              <>
                <div style={{ position: 'absolute', left: 10 + (depth - 1) * 16 + 6, top: 0, bottom: 0, width: 1, background: '#2a2a2a' }} />
                <div style={{ position: 'absolute', left: 10 + (depth - 1) * 16 + 6, top: '50%', width: 7, height: 1, background: '#2a2a2a' }} />
              </>
            )}

            {hasChildren ? (
              <button
                aria-label={isExpanded ? 'collapse' : 'expand'}
                onClick={(e) => { e.stopPropagation(); onToggleExpand(sess.session_id) }}
                style={{ color: selected ? 'var(--brand)' : '#555', fontSize: 9, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, width: 10 }}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span style={{ color: '#333', fontSize: 9, width: 10, flexShrink: 0 }}>—</span>
            )}

            <span style={{ color: agentColor(sess.agent), fontSize: 11, flexShrink: 0 }}>◈</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: selected ? '#c4b5fd' : isRoot ? '#ccc' : '#999', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sess.session_id ? sess.session_id.slice(0, 12) : node.agent_id?.slice(0, 12) ?? '—'}
              </div>
              <div style={{ fontSize: 8, color: running ? 'var(--brand)' : '#444', marginTop: 1 }}>
                {running ? `● ${formatDuration(duration)}…` : formatDuration(duration)}
              </div>
            </div>

            {running && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 4px #4ade80', flexShrink: 0 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
