import { useState } from 'react'
import { ChevronRight, ChevronDown, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TraceSpan } from './hooks/useTraces'

interface Props {
  span: TraceSpan
  depth: number
  selected: TraceSpan | null
  onSelect: (span: TraceSpan) => void
  globalStart: number
  globalDuration: number
}

function getSpanColor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('llm') || t.includes('chat') || t.includes('model')) {
    return 'bg-gradient-to-r from-orange-400 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.3)]' // Orange gradient
  }
  if (t.includes('retriever') || t.includes('tool') || t.includes('vector')) {
    return 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.3)]' // Purple gradient
  }
  return 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' // Blue gradient
}

export function TraceTreeNode({ span, depth, selected, onSelect, globalStart, globalDuration }: Props) {
  const [expanded, setExpanded] = useState(true)
  const isSelected = selected?.id === span.id

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  // Calculate Gantt position
  const leftPct = ((span.startTime - globalStart) / globalDuration) * 100
  const widthPct = Math.max((span.duration / globalDuration) * 100, 0.5) // min width 0.5% for visibility

  const colorClass = getSpanColor(span.type)

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center h-[34px] group cursor-pointer border-l-[3px] border-b border-b-white/5 transition-all duration-200",
          isSelected 
            ? "bg-blue-500/10 border-l-blue-500" 
            : "border-l-transparent hover:bg-white/[0.03]"
        )}
        onClick={() => onSelect(span)}
      >
        <div 
          className={cn(
            "w-[300px] shrink-0 sticky left-0 z-20 border-r border-white/10 h-full flex items-center pr-3 transition-colors",
            isSelected ? "bg-[#101b2b]" : "bg-[#0a0a0a] group-hover:bg-[#111]"
          )}
          style={{ paddingLeft: `${(depth * 16) + 12}px` }}
        >
          <div className="w-4 h-4 flex items-center justify-center mr-1 shrink-0">
            {span.children.length > 0 && (
              <button onClick={toggleExpand} className="text-[#666] hover:text-[#ccc]">
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          
          <div className={cn("px-2 py-0.5 rounded-[4px] text-[10px] font-bold mr-2 flex-shrink-0 text-white shadow-sm flex items-center gap-1.5", colorClass)}>
            <Cpu className="w-3 h-3" />
            {span.type}
          </div>
          
          <span className="text-[12px] text-[#ccc] truncate" title={span.name}>
            {span.name}
          </span>
        </div>

        <div className="relative flex-1 h-full mx-4 flex items-center">
          {/* Gantt Bar */}
          <div 
            className={cn("absolute h-[20px] rounded-full opacity-90 group-hover:opacity-100 transition-all duration-300", colorClass)}
            style={{ 
              left: `${leftPct}%`, 
              width: `${widthPct}%`,
              minWidth: '4px'
            }}
          />
          <span 
            className="absolute text-[10px] text-white/50 font-medium tracking-wide"
            style={{ left: `calc(${leftPct + widthPct}% + 6px)` }}
          >
            {(span.duration / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      {expanded && span.children.length > 0 && (
        <div className="flex flex-col relative">
          {/* Indentation line */}
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-white/20 pointer-events-none"
            style={{ left: `${((depth + 1) * 16) + 15}px` }}
          />
          {span.children.map(child => (
            <TraceTreeNode
              key={child.id}
              span={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              globalStart={globalStart}
              globalDuration={globalDuration}
            />
          ))}
        </div>
      )}
    </div>
  )
}
