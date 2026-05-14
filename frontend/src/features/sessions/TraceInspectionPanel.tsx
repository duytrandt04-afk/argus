import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Copy, FileJson, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TraceSpan } from './hooks/useTraces'

interface Props {
  span: TraceSpan | null
}

function JsonBlock({ title, data }: { title: string, data: any }) {
  const [copied, setCopied] = useState(false)
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  
  if (!content) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highlightJson = (json: string) => {
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;
    const html = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(regex, (match) => {
        let cls = 'text-green-400' // string value
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-indigo-400 font-semibold' // key
          } else {
            cls = 'text-emerald-400' // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-amber-500 font-bold' // boolean
        } else if (/null/.test(match)) {
          cls = 'text-gray-500 italic' // null
        } else {
          cls = 'text-orange-400' // number
        }
        return `<span class="${cls}">${match}</span>`
      })
    return { __html: html }
  }

  return (
    <div className="flex flex-col mb-6 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-medium text-[#ccc]">{title}</h4>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-[#888] hover:text-[#ccc]" onClick={handleCopy}>
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-[#888] hover:text-[#ccc]">
            <FileJson className="w-3 h-3 mr-1" />
            View Raw
          </Button>
        </div>
      </div>
      <div className="bg-black/60 border border-white/10 shadow-inner rounded-xl p-4 overflow-x-auto min-w-0">
        <pre 
          className="text-[12px] text-blue-100/80 leading-relaxed font-mono" 
          style={{ fontFamily: '"Fira Code", "JetBrains Mono", monospace' }}
          dangerouslySetInnerHTML={highlightJson(content)}
        />
      </div>
    </div>
  )
}

export function TraceInspectionPanel({ span }: Props) {
  if (!span) {
    return (
      <div className="flex items-center justify-center h-full text-[#555] text-xs">
        Select a span to view details
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="px-5 pt-5 pb-3 border-b border-white/10 bg-black/20 shrink-0">
        <h3 className="text-[15px] font-bold text-white mb-1 flex items-center gap-3">
          <span className="bg-white/10 border border-white/10 px-2 py-0.5 rounded-md text-white/80 text-[10px] tracking-widest uppercase shadow-sm">{span.type}</span>
          {span.name}
        </h3>
      </div>
      
      <Tabs defaultValue="run" className="flex flex-col flex-1 min-h-0">
        <div className="px-5 border-b border-white/10 bg-black/20">
          <TabsList className="bg-transparent h-11 p-0 gap-6">
            <TabsTrigger 
              value="run" 
              className="px-1 h-11 rounded-none border-0 border-b-2 border-x-transparent border-t-transparent data-[state=active]:border-x-transparent data-[state=active]:border-t-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/50 data-[state=active]:text-white text-[13px] font-medium transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              Run
            </TabsTrigger>
            <TabsTrigger 
              value="metadata" 
              className="px-1 h-11 rounded-none border-0 border-b-2 border-x-transparent border-t-transparent data-[state=active]:border-x-transparent data-[state=active]:border-t-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/50 data-[state=active]:text-white text-[13px] font-medium transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              Metadata
            </TabsTrigger>
            <TabsTrigger 
              value="feedback" 
              className="px-1 h-11 rounded-none border-0 border-b-2 border-x-transparent border-t-transparent data-[state=active]:border-x-transparent data-[state=active]:border-t-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/50 data-[state=active]:text-white text-[13px] font-medium transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            >
              Feedback
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5 min-w-0">
            <TabsContent value="run" className="m-0 focus-visible:outline-none min-w-0">
              <div className="flex items-center gap-6 text-[12px] text-white/60 mb-8 border border-white/10 bg-white/5 p-3 rounded-xl shadow-sm min-w-0">
                <div className="flex flex-col"><span className="text-[10px] uppercase tracking-wider text-white/40">Run ID</span><span className="text-white/90 font-mono mt-0.5 truncate">{span.id}</span></div>
                <div className="w-px h-8 bg-white/10 shrink-0" />
                <div className="flex flex-col shrink-0"><span className="text-[10px] uppercase tracking-wider text-white/40">Duration</span><span className="text-white/90 mt-0.5">{span.duration}ms</span></div>
              </div>

              {span.event.prompt && <JsonBlock title="Input (Prompt)" data={span.event.prompt} />}
              {span.event.tool_calls_json && <JsonBlock title="Input (Tool Calls)" data={span.event.tool_calls_json} />}
              {(!span.event.prompt && !span.event.tool_calls_json) && <JsonBlock title="Raw Payload" data={span.event} />}

              {span.event.response && <JsonBlock title="Output (Response)" data={span.event.response} />}
              {span.event.tool_result_stdout && <JsonBlock title="Output (Stdout)" data={span.event.tool_result_stdout} />}
              {span.event.tool_result_stderr && <JsonBlock title="Output (Stderr)" data={span.event.tool_result_stderr} />}
            </TabsContent>

            <TabsContent value="metadata" className="m-0 focus-visible:outline-none min-w-0">
              <JsonBlock title="Metadata" data={{
                agent: span.event.agent,
                session_id: span.event.session,
                hook_event_name: span.event.hook_event_name,
                model: span.event.model,
                source: span.event.source,
                turn_id: span.event.turn_id,
                task_id: span.event.task_id,
              }} />
            </TabsContent>

            <TabsContent value="feedback" className="m-0 focus-visible:outline-none min-w-0">
              <div className="text-xs text-[#666]">No feedback available for this run.</div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
