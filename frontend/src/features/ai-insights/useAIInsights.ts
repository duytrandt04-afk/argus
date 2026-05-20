import { useCallback, useEffect, useState } from 'react'
import type { AIInsightsResponse } from '@/types/ai-insights'

const EMPTY_INSIGHTS: AIInsightsResponse = {
  summaries: [],
  observations: [],
}

export function useAIInsights() {
  const [insights, setInsights] = useState<AIInsightsResponse>(EMPTY_INSIGHTS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/ai-insights')
      if (!res.ok) throw new Error(`request failed with ${res.status}`)
      const data = (await res.json()) as Partial<AIInsightsResponse>
      setInsights({
        summaries: data.summaries ?? [],
        observations: data.observations ?? [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load AI insights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { insights, loading, refreshing, error, reload }
}
