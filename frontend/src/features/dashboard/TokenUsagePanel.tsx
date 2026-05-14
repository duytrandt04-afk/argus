import type { DashboardStats } from './hooks/useDashboardStats'
import { TokenUsageChart } from './TokenUsageChart'
import { TokenTimelineChart } from './TokenTimelineChart'
import { SessionsTable } from './SessionsTable'

type TokenUsagePanelProps = {
  stats: DashboardStats
  query?: string
}

export function TokenUsagePanel({ stats, query = '' }: TokenUsagePanelProps) {
  return (
    <div className="grid gap-4">
      <TokenTimelineChart stats={stats} query={query} />
      <TokenUsageChart stats={stats} />
      <SessionsTable stats={stats} />
    </div>
  )
}
