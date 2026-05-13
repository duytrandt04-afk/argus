import type { SessionTreeNode } from '@/types/sessions'
import { barColor, flattenTree, formatTimeAxis, isRunning, sessionDurationMs } from './utils'

interface Props {
  nodes: SessionTreeNode[]
  expanded: Set<string>
  selectedNode: SessionTreeNode | null
  now: number
}

const ROW_HEIGHT_ROOT = 44
const ROW_HEIGHT_CHILD = 36

export function SessionGantt({ nodes, expanded, selectedNode, now }: Props) {
  const rows = flattenTree(nodes, expanded)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#0f0f0f', position: 'relative' }}>
      <div style={{ height: 28, background: '#111', borderBottom: '1px solid var(--app-border)', flexShrink: 0 }} />

      {rows.map((row, index) => {
        const { node, isRoot, rootNode } = row
        const sess = node.session
        const selected = selectedNode?.session.session_id === sess.session_id
        const rootDuration = sessionDurationMs(rootNode.session, now)
        const height = isRoot ? ROW_HEIGHT_ROOT : ROW_HEIGHT_CHILD

        let leftPct = 0
        let widthPct = 100

        if (!isRoot && rootDuration > 0) {
          const childStart = new Date(sess.started_at).getTime() - new Date(rootNode.session.started_at).getTime()
          const childDuration = sessionDurationMs(sess, now)
          if (Number.isFinite(childStart) && Number.isFinite(childDuration)) {
            leftPct = Math.max(0, (childStart / rootDuration) * 100)
            widthPct = Math.min(100 - leftPct, (childDuration / rootDuration) * 100)
          } else {
            leftPct = 0
            widthPct = 0
          }
        }

        const running = isRunning(sess, now)
        const color = isRoot
          ? 'linear-gradient(90deg,#581c87,#7c3aed)'
          : barColor(sess.agent, running)

        return (
          <div
            key={sess.session_id || node.agent_id || `${rootNode.session.session_id || 'root'}-${index}`}
            style={{
              height,
              borderBottom: selected ? '1px solid #2d1f4a' : '1px solid #1a1a1a',
              background: selected ? '#130e1f' : isRoot ? '#191919' : '#0f0f0f',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {isRoot && rootDuration > 0 && (
              <div style={{ position: 'absolute', top: 4, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                  <span key={pct} style={{ fontSize: 8, color: '#333' }}>
                    {formatTimeAxis(pct * rootDuration)}
                  </span>
                ))}
              </div>
            )}

            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct}%`, width: 1, background: '#1a1a1a', pointerEvents: 'none' }}
              />
            ))}

            <div
              data-testid="gantt-bar"
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                marginTop: isRoot ? 6 : 0,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: isRoot ? 16 : 14,
                background: color,
                borderRadius: 3,
                opacity: running ? 0.9 : 0.75,
                minWidth: 2,
                overflow: 'hidden',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
