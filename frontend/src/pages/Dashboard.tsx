import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvents } from '../hooks/useEvents'

const COLORS = ['#47ff9c', '#818cf8', '#f97316', '#e879f9', '#2dd4bf', '#fbbf24']

export function Dashboard() {
  const { events } = useEvents()

  const { totalSessions, totalEvents, topActions, timelineData, activeAgents } = useMemo(() => {
    const totalEvents = events.length
    const sessionSet = new Set<string>()
    const actionCounts: Record<string, number> = {}
    const agentCounts: Record<string, number> = {}
    
    // For timeline, we bucket events by hour or day depending on range
    // Since events can be very recent, let's bucket by hour for the last 24h or so, 
    // but a simple approach: just bucket by the formatted date string "YYYY-MM-DD HH:00"
    const timelineMap = new Map<string, number>()

    events.forEach(event => {
      // Sessions
      if (event.session) {
        sessionSet.add(event.session)
      } else if (event.transcript_path) {
        sessionSet.add(event.transcript_path)
      }

      // Actions
      const action = event.action || 'UNKNOWN'
      actionCounts[action] = (actionCounts[action] || 0) + 1

      // Agents (derived from tool or action if agent name not directly available)
      const agent = event.tool ? event.tool.split('_')[0] : 'core'
      agentCounts[agent] = (agentCounts[agent] || 0) + 1

      // Timeline
      const timeStr = event.time
      if (timeStr) {
        try {
          const date = new Date(timeStr.replace(' ', 'T'))
          if (!isNaN(date.getTime())) {
            // Group by hour
            const bucket = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`
            timelineMap.set(bucket, (timelineMap.get(bucket) || 0) + 1)
          }
        } catch (e) {
          // ignore
        }
      }
    })

    const topActions = Object.entries(actionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const timelineData = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      // if too many, take the last 24
      .slice(-24)

    const activeAgents = Object.keys(agentCounts).length

    return {
      totalSessions: sessionSet.size,
      totalEvents,
      topActions,
      timelineData,
      activeAgents
    }
  }, [events])

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white tracking-wider">OVERVIEW DASHBOARD</h2>
        <div className="text-zinc-300 text-base font-medium">
          {totalEvents.toLocaleString()} events analyzed
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="bg-[#0c0c0c] border-[#333]">
          <CardContent className="p-6">
            <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Sessions</div>
            <div className="text-4xl font-bold text-[#47ff9c]">
              {totalSessions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0c0c0c] border-[#333]">
          <CardContent className="p-6">
            <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Events</div>
            <div className="text-4xl font-bold text-[#818cf8]">
              {totalEvents.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0c0c0c] border-[#333]">
          <CardContent className="p-6">
            <div className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-2">Active Agent Tools</div>
            <div className="text-4xl font-bold text-[#f97316]">
              {activeAgents.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <Card className="bg-[#0c0c0c] border-[#333] col-span-2">
          <CardHeader className="pb-4 border-b border-[#222]">
            <CardTitle className="text-zinc-300 text-sm font-semibold uppercase tracking-wider">
              Activity Timeline (Events / Hour)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#47ff9c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#47ff9c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#888" 
                      fontSize={11} 
                      tickFormatter={(val) => {
                        // "2026-05-05 10:00" -> "10:00"
                        const parts = val.split(' ')
                        return parts[1] || val
                      }} 
                    />
                    <YAxis stroke="#888" fontSize={11} />
                    <RechartsTooltip
                      contentStyle={{ background: '#111', border: '1px solid #333', fontSize: '12px', color: '#fff' }}
                      itemStyle={{ color: '#47ff9c' }}
                      labelStyle={{ color: '#ccc', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#47ff9c" strokeWidth={2} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm italic">
                  Not enough data for timeline
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Distribution */}
        <Card className="bg-[#0c0c0c] border-[#333]">
          <CardHeader className="pb-4 border-b border-[#222]">
            <CardTitle className="text-zinc-300 text-sm font-semibold uppercase tracking-wider">
              Top Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px] w-full">
              {topActions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topActions} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#ccc" 
                      fontSize={11} 
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#111', border: '1px solid #333', fontSize: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {topActions.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm italic">
                  No actions recorded
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
