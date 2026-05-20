import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, FileText, RefreshCw, Search, Sparkles, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAIInsights } from './useAIInsights'
import type { AIInsightObservation, AIInsightSummary } from '@/types/ai-insights'

function formatDate(value: string) {
  if (!value) return 'unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

function projectName(cwd: string) {
  if (!cwd) return 'Unknown project'
  const parts = cwd.split('/').filter(Boolean)
  return parts.at(-1) ?? cwd
}

function sessionHref(sessionID: string) {
  return `/?session=${encodeURIComponent(sessionID)}`
}

function eventHref(item: AIInsightObservation) {
  if (!item.session_id || !item.tool_use_id) return sessionHref(item.session_id)
  return `/?session=${encodeURIComponent(item.session_id)}&event=${encodeURIComponent(item.tool_use_id)}`
}

function matchesQuery(summary: AIInsightSummary, query: string) {
  const haystack = [
    summary.session_id,
    summary.agent,
    summary.cwd,
    summary.summary,
    summary.model,
  ].join(' ')
  return haystack.toLowerCase().includes(query)
}

function matchesObservationQuery(observation: AIInsightObservation, query: string) {
  const haystack = [
    observation.session_id,
    observation.agent,
    observation.cwd,
    observation.tool_name,
    observation.observation,
    observation.model,
    observation.action,
    observation.path,
  ].join(' ')
  return haystack.toLowerCase().includes(query)
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BrainCircuit
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 border border-white/10 bg-white/[0.035] px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

function SummaryRow({ item }: { item: AIInsightSummary }) {
  return (
    <article className="grid gap-3 border-t border-white/10 px-4 py-3 first:border-t-0 md:grid-cols-[minmax(160px,240px)_1fr_160px]">
      <div className="min-w-0">
        <Link
          to={sessionHref(item.session_id)}
          className="truncate text-[13px] font-semibold text-white hover:text-white/80"
          aria-label={`Open ${item.session_id} trace`}
        >
          {item.session_id}
        </Link>
        <div className="mt-1 truncate text-[12px] text-white/45">{projectName(item.cwd)}</div>
        <div className="truncate text-[11px] text-white/35">{item.agent || 'unknown agent'}</div>
      </div>
      <p className="text-[13px] leading-6 text-white/78">{item.summary}</p>
      <div className="min-w-0 text-left md:text-right">
        <div className="truncate text-[12px] text-white/60">{item.model || 'unknown model'}</div>
        <div className="mt-1 text-[11px] text-white/35">{formatDate(item.updated_at)}</div>
      </div>
    </article>
  )
}

function ObservationRow({ item }: { item: AIInsightObservation }) {
  return (
    <article className="grid gap-3 border-t border-white/10 px-4 py-3 first:border-t-0 lg:grid-cols-[170px_130px_1fr_160px]">
      <div className="min-w-0">
        <Link
          to={eventHref(item)}
          className="truncate text-[13px] font-semibold text-white hover:text-white/80"
          aria-label={`Open ${item.session_id} trace`}
        >
          {item.session_id}
        </Link>
        <div className="mt-1 truncate text-[11px] text-white/40">{projectName(item.cwd)}</div>
      </div>
      <div className="min-w-0">
        <span className="inline-flex max-w-full items-center gap-1.5 border border-white/10 bg-black/30 px-2 py-1 text-[12px] text-white/65">
          <Wrench className="size-3" />
          <span className="truncate">{item.tool_name || 'Tool'}</span>
        </span>
        <div className="mt-1 truncate text-[11px] text-white/35">
          {item.action || item.tool_use_id}
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] leading-6 text-white/78">{item.observation}</p>
        {item.path && (
          <div className="mt-1 truncate font-mono text-[11px] text-white/35">{item.path}</div>
        )}
      </div>
      <div className="min-w-0 text-left lg:text-right">
        <div className="truncate text-[12px] text-white/60">{item.model || 'unknown model'}</div>
        <div className="mt-1 text-[11px] text-white/35">
          {formatDate(item.event_time || item.created_at)}
        </div>
      </div>
    </article>
  )
}

export function AIInsightsPage() {
  const { insights, loading, refreshing, error, reload } = useAIInsights()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const models = useMemo(() => {
    const values = new Set<string>()
    for (const summary of insights.summaries) if (summary.model) values.add(summary.model)
    for (const observation of insights.observations)
      if (observation.model) values.add(observation.model)
    return Array.from(values).sort()
  }, [insights])

  const summaries = useMemo(
    () =>
      normalizedQuery
        ? insights.summaries.filter((summary) => matchesQuery(summary, normalizedQuery))
        : insights.summaries,
    [insights.summaries, normalizedQuery]
  )
  const observations = useMemo(
    () =>
      normalizedQuery
        ? insights.observations.filter((item) => matchesObservationQuery(item, normalizedQuery))
        : insights.observations,
    [insights.observations, normalizedQuery]
  )

  const latestTime =
    [
      ...insights.summaries.map((item) => item.updated_at),
      ...insights.observations.map((item) => item.created_at),
    ]
      .filter(Boolean)
      .sort()
      .at(-1) ?? ''

  return (
    <div className="flex h-full flex-col bg-[#090909] text-white">
      <header className="border-b border-white/10 bg-black/40 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
              <BrainCircuit className="size-3.5" />
              Generated context
            </div>
            <h1 className="mt-1 text-xl font-semibold text-white">AI Insights</h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <label className="relative min-w-0 sm:w-[320px]">
              <span className="sr-only">Search AI insights</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/35" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sessions, tools, models..."
                className="border-white/10 bg-black/40 pl-8 text-[13px] text-white placeholder:text-white/30"
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={refreshing}
              className="border-white/10 bg-black/40 text-white/70 hover:bg-white/[0.06] hover:text-white"
            >
              <RefreshCw data-icon="inline-start" className={cn(refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={FileText} label="Summaries" value={String(insights.summaries.length)} />
          <Metric
            icon={Sparkles}
            label="Observations"
            value={String(insights.observations.length)}
          />
          <Metric icon={BrainCircuit} label="Models" value={String(models.length)} />
          <Metric icon={RefreshCw} label="Latest" value={formatDate(latestTime)} />
        </div>

        {error && (
          <div className="mt-4 border border-red-500/25 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
            {error}
          </div>
        )}

        <Tabs defaultValue="summaries" className="mt-5">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="summaries">Summaries ({summaries.length})</TabsTrigger>
            <TabsTrigger value="observations">Observations ({observations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summaries" forceMount className="mt-3">
            <section className="border border-white/10 bg-white/[0.025]">
              {loading ? (
                <div className="px-4 py-8 text-[13px] text-white/45">Loading AI insights...</div>
              ) : summaries.length === 0 ? (
                <div className="px-4 py-8 text-[13px] text-white/45">
                  No summaries found. Stop-hook jobs will appear here after the worker generates
                  them.
                </div>
              ) : (
                summaries.map((item) => <SummaryRow key={item.session_id} item={item} />)
              )}
            </section>
          </TabsContent>

          <TabsContent value="observations" forceMount className="mt-3">
            <section className="border border-white/10 bg-white/[0.025]">
              {loading ? (
                <div className="px-4 py-8 text-[13px] text-white/45">Loading AI insights...</div>
              ) : observations.length === 0 ? (
                <div className="px-4 py-8 text-[13px] text-white/45">
                  No observations found. Tool-use observation jobs will appear here after
                  processing.
                </div>
              ) : (
                observations.map((item) => <ObservationRow key={item.tool_use_id} item={item} />)
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
