import { useMemo, useState, useEffect } from 'react'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { useTraces, type TraceSpan } from './hooks/useTraces'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TraceInspectionPanel } from './TraceInspectionPanel'
import { TraceTreeNode } from './TraceTreeNode'

type TimeRangeOption = '1h' | '6h' | '24h' | '7d' | '30d' | 'all'

function sinceFromOption(opt: TimeRangeOption): string {
  const now = new Date()
  switch (opt) {
    case '1h': return new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
    case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'all': return '2000-01-01T00:00:00Z'
  }
}

export function SessionsPage() {
  const [timeRangeOpt, setTimeRangeOpt] = useState<TimeRangeOption>('1h')
  const since = useMemo(() => sinceFromOption(timeRangeOpt), [timeRangeOpt])
  const [zoom, setZoom] = useState(1)

  const { traces, loading } = useTraces(since)
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null)
  
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  
  // Traverse tree to get min/max over all spans for absolute timeline
  const minTime = useMemo(() => {
    let min = Infinity
    const traverse = (nodes: TraceSpan[]) => {
      for (const n of nodes) {
        if (n.startTime < min) min = n.startTime
        traverse(n.children)
      }
    }
    traverse(traces)
    return min === Infinity ? 0 : min
  }, [traces])

  const maxTime = useMemo(() => {
    let max = -Infinity
    const traverse = (nodes: TraceSpan[]) => {
      for (const n of nodes) {
        if (n.endTime > max) max = n.endTime
        traverse(n.children)
      }
    }
    traverse(traces)
    return max === -Infinity ? 1000 : max
  }, [traces])

  const totalDuration = Math.max(maxTime - minTime, 1000) // minimum 1s scale

  const renderTimeAxis = () => {
    const ticks = []
    const numTicks = Math.max(10, Math.floor(10 * Math.log2(zoom + 1)))
    for (let i = 0; i <= numTicks; i++) {
      const p = i / numTicks
      const timestamp = minTime + (totalDuration * p)
      const date = new Date(timestamp)
      const label = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })
      ticks.push(
        <div key={i} className="absolute text-[10px] text-white/40 select-none flex flex-col items-center h-full" 
             style={{ 
               left: `${p * 100}%`, 
               transform: i === 0 ? 'translateX(0)' : i === numTicks ? 'translateX(-100%)' : 'translateX(-50%)' 
             }}>
          <span className="mt-1">{label}</span>
          <div className="w-px h-full bg-white/10 mt-1" />
        </div>
      )
    }
    return (
      <div className="flex sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/10 h-8 w-full">
        <div className="w-[300px] shrink-0 sticky left-0 z-40 bg-[#0a0a0a] border-r border-white/10 h-full flex items-center px-4 text-white/50 text-[11px] font-semibold tracking-wider uppercase shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
          Trace Name
        </div>
        <div className="relative flex-1 h-full mx-4">
          {ticks}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0 z-10 shadow-sm">
        <span className="text-[12px] text-white/70 font-semibold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Traces</span>
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 mr-6 border border-white/10 rounded-md p-0.5 bg-black/20">
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(z / 1.5, 1))} className="h-7 px-2 hover:bg-white/10 text-white/70">-</Button>
          <span className="text-[11px] text-white/50 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(z * 1.5, 100000))} className="h-7 px-2 hover:bg-white/10 text-white/70">+</Button>
        </div>

        <Select value={timeRangeOpt} onValueChange={(v) => setTimeRangeOpt(v as TimeRangeOption)}>
          <SelectTrigger size="sm" className="h-8 border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-3 py-0 text-[12px] text-white/80 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last 1h</SelectItem>
            <SelectItem value="6h">Last 6h</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <PanelGroup orientation={isMobile ? 'vertical' : 'horizontal'}>
          {/* Pane 2: Hierarchical Trace Tree */}
          <Panel defaultSize={isMobile ? 50 : 65} minSize={30} className="flex flex-col min-w-0 bg-[#0a0a0a] relative">
            <div className="flex-1 overflow-auto relative">
              <div className="flex flex-col min-w-full" style={{ width: `${zoom * 100}%` }}>
                {renderTimeAxis()}
                
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-[#555] text-xs sticky left-0 w-full">Loading traces...</div>
                ) : traces.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-[#555] text-xs sticky left-0 w-full">No traces found for this period.</div>
                ) : (
                  <div className="flex flex-col min-w-max pb-4">
                    {traces.map((trace) => (
                      <TraceTreeNode 
                        key={trace.id} 
                        span={trace} 
                        depth={0} 
                        selected={selectedSpan} 
                        onSelect={setSelectedSpan} 
                        globalStart={minTime} 
                        globalDuration={totalDuration} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="relative flex w-1 md:w-1.5 items-center justify-center bg-white/5 hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-20 cursor-row-resize md:cursor-col-resize">
            <div className="w-8 h-0.5 md:w-0.5 md:h-8 bg-white/20 rounded-full" />
          </PanelResizeHandle>

          {/* Pane 3: Inspection Panel */}
          <Panel defaultSize={isMobile ? 50 : 35} minSize={25} className="flex flex-col min-w-0 bg-black/20 shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.5)] z-10 border-t md:border-t-0 md:border-l border-white/10">
            <TraceInspectionPanel span={selectedSpan} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
