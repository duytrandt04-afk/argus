import { useEffect, useState } from 'react'
import type {
  AnthropicUsageResponse,
  OpenAIUsageResponse,
  UsageDailyPoint,
  UsageStats,
} from '@/types/usage'

const USAGE_BUCKET_LIMIT = 31
const USAGE_CACHE_PREFIX = 'usage_cache'

const DASHBOARD_RANGE_TO_SECONDS: Record<string, number> = {
  '1h': 60 * 60,
  '6h': 6 * 60 * 60,
  '24h': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60,
  '30d': 30 * 24 * 60 * 60,
  all: 365 * 24 * 60 * 60,
}

function rangeToSeconds(range: string) {
  return DASHBOARD_RANGE_TO_SECONDS[range] ?? DASHBOARD_RANGE_TO_SECONDS['7d']
}

function usageDateFromUnix(bucketStartTime: number) {
  return new Date(bucketStartTime * 1000).toISOString().split('T')[0]
}

function usageDateFromRFC3339(timestamp: string) {
  return timestamp.split('T')[0]
}

function toAnthropicTokenCount(result: {
  uncached_input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation?: {
    ephemeral_1h_input_tokens?: number
    ephemeral_5m_input_tokens?: number
  }
}) {
  return (
    Number(result.uncached_input_tokens || 0) +
    Number(result.output_tokens || 0) +
    Number(result.cache_read_input_tokens || 0) +
    Number(result.cache_creation?.ephemeral_1h_input_tokens || 0) +
    Number(result.cache_creation?.ephemeral_5m_input_tokens || 0)
  )
}

type UsageCachePayload = {
  fetchedAt: string
  periodStart: string
  periodEnd: string
  stats: UsageStats
}

function usageCacheKey(provider: 'openai' | 'anthropic', range: string) {
  return `${USAGE_CACHE_PREFIX}_${provider}_${range}`
}

export function useOpenAIUsage(
  range: string = '7d',
  provider: 'openai' | 'anthropic' = 'openai',
  anthropicApiKey: string = ''
) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_admin_key') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [statsCacheKey, setStatsCacheKey] = useState(() => usageCacheKey(provider, range))

  useEffect(() => {
    localStorage.setItem('openai_admin_key', apiKey)
  }, [apiKey])

  const emptyOpenAIUsageResponse: OpenAIUsageResponse = { data: [] }
  const emptyAnthropicUsageResponse: AnthropicUsageResponse = { data: [] }

  const readCachedStats = (cacheKey: string): UsageStats | null => {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    try {
      const cached = JSON.parse(raw) as UsageCachePayload
      return cached?.stats?.daily ? cached.stats : null
    } catch {
      localStorage.removeItem(cacheKey)
      return null
    }
  }

  const readOpenAIUsageResponse = async (response: Response): Promise<OpenAIUsageResponse> => {
    if (!response.ok) return emptyOpenAIUsageResponse
    try {
      return (await response.json()) as OpenAIUsageResponse
    } catch {
      return emptyOpenAIUsageResponse
    }
  }

  const readAnthropicUsageResponse = async (
    response: Response
  ): Promise<AnthropicUsageResponse> => {
    if (!response.ok) return emptyAnthropicUsageResponse
    try {
      return (await response.json()) as AnthropicUsageResponse
    } catch {
      return emptyAnthropicUsageResponse
    }
  }

  const readPrimaryOpenAIUsageResponse = async (
    response: Response
  ): Promise<OpenAIUsageResponse> => {
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`
      try {
        const d = (await response.json()) as OpenAIUsageResponse
        if (d.error?.message) errorMsg = d.error.message
      } catch {
        errorMsg = `Backend returned ${response.status}: Please make sure to restart your Go backend!`
      }
      throw new Error(errorMsg)
    }
    return (await response.json()) as OpenAIUsageResponse
  }

  const readPrimaryAnthropicUsageResponse = async (
    response: Response
  ): Promise<AnthropicUsageResponse> => {
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`
      try {
        const d = (await response.json()) as AnthropicUsageResponse
        if (d.error?.message) errorMsg = d.error.message
      } catch {
        errorMsg = `Backend returned ${response.status}: Please make sure to restart your Go backend!`
      }
      throw new Error(errorMsg)
    }
    return (await response.json()) as AnthropicUsageResponse
  }

  const fetchOpenAIUsagePages = async (
    start: number,
    end: number,
    headers: HeadersInit,
    groupBy?: 'model' | 'api_key_id'
  ): Promise<OpenAIUsageResponse> => {
    const rangeSeconds = rangeToSeconds(range)
    let page: string | undefined
    let pagesFetched = 0
    const maxPages = Math.ceil(rangeSeconds / (USAGE_BUCKET_LIMIT * 24 * 60 * 60)) + 1
    const seenPages = new Set<string>()
    const data: NonNullable<OpenAIUsageResponse['data']> = []

    try {
      do {
        if (pagesFetched >= maxPages || (page && seenPages.has(page))) break
        if (page) seenPages.add(page)
        pagesFetched += 1

        const params = new URLSearchParams({
          start_time: String(start),
          end_time: String(end),
          bucket_width: '1d',
          limit: String(USAGE_BUCKET_LIMIT),
        })
        if (groupBy) params.set('group_by', groupBy)
        if (page) params.set('page', page)

        const response = await readOpenAIUsageResponse(
          await fetch(`/api/openai/usage/completions?${params.toString()}`, { headers })
        )
        data.push(...(response.data ?? []))
        page = response.has_more ? (response.next_page ?? undefined) : undefined
      } while (page)

      return { data }
    } catch {
      return emptyOpenAIUsageResponse
    }
  }

  const fetchPrimaryOpenAIUsagePages = async (
    start: number,
    end: number,
    headers: HeadersInit
  ): Promise<OpenAIUsageResponse> => {
    const rangeSeconds = rangeToSeconds(range)
    let page: string | undefined
    let pagesFetched = 0
    const maxPages = Math.ceil(rangeSeconds / (USAGE_BUCKET_LIMIT * 24 * 60 * 60)) + 1
    const seenPages = new Set<string>()
    const data: NonNullable<OpenAIUsageResponse['data']> = []

    do {
      if (pagesFetched >= maxPages || (page && seenPages.has(page))) break
      if (page) seenPages.add(page)
      pagesFetched += 1

      const params = new URLSearchParams({
        start_time: String(start),
        end_time: String(end),
        bucket_width: '1d',
        limit: String(USAGE_BUCKET_LIMIT),
      })
      if (page) params.set('page', page)

      const response = await readPrimaryOpenAIUsageResponse(
        await fetch(`/api/openai/usage/completions?${params.toString()}`, { headers })
      )
      data.push(...(response.data ?? []))
      page = response.has_more ? (response.next_page ?? undefined) : undefined
    } while (page)

    return { data }
  }

  const fetchAnthropicUsagePages = async (
    start: string,
    end: string,
    headers: HeadersInit,
    groupBy?: 'model' | 'api_key_id'
  ): Promise<AnthropicUsageResponse> => {
    const rangeSeconds = rangeToSeconds(range)
    let page: string | undefined
    let pagesFetched = 0
    const maxPages = Math.ceil(rangeSeconds / (USAGE_BUCKET_LIMIT * 24 * 60 * 60)) + 1
    const seenPages = new Set<string>()
    const data: NonNullable<AnthropicUsageResponse['data']> = []

    try {
      do {
        if (pagesFetched >= maxPages || (page && seenPages.has(page))) break
        if (page) seenPages.add(page)
        pagesFetched += 1

        const params = new URLSearchParams({
          starting_at: start,
          ending_at: end,
          bucket_width: '1d',
          limit: String(USAGE_BUCKET_LIMIT),
        })
        if (groupBy) params.append('group_by[]', groupBy)
        if (page) params.set('page', page)

        const response = await readAnthropicUsageResponse(
          await fetch(`/api/anthropic/organizations/usage_report/messages?${params.toString()}`, {
            headers,
          })
        )
        data.push(...(response.data ?? []))
        page = response.has_more ? (response.next_page ?? undefined) : undefined
      } while (page)

      return { data }
    } catch {
      return emptyAnthropicUsageResponse
    }
  }

  const fetchPrimaryAnthropicUsagePages = async (
    start: string,
    end: string,
    headers: HeadersInit
  ): Promise<AnthropicUsageResponse> => {
    const rangeSeconds = rangeToSeconds(range)
    let page: string | undefined
    let pagesFetched = 0
    const maxPages = Math.ceil(rangeSeconds / (USAGE_BUCKET_LIMIT * 24 * 60 * 60)) + 1
    const seenPages = new Set<string>()
    const data: NonNullable<AnthropicUsageResponse['data']> = []

    do {
      if (pagesFetched >= maxPages || (page && seenPages.has(page))) break
      if (page) seenPages.add(page)
      pagesFetched += 1

      const params = new URLSearchParams({
        starting_at: start,
        ending_at: end,
        bucket_width: '1d',
        limit: String(USAGE_BUCKET_LIMIT),
      })
      if (page) params.set('page', page)

      const response = await readPrimaryAnthropicUsageResponse(
        await fetch(`/api/anthropic/organizations/usage_report/messages?${params.toString()}`, {
          headers,
        })
      )
      data.push(...(response.data ?? []))
      page = response.has_more ? (response.next_page ?? undefined) : undefined
    } while (page)

    return { data }
  }

  const makeDailyPoint = (date: string): UsageDailyPoint => ({
    date,
    tokens: 0,
    requests: 0,
    models: {},
  })

  const cacheUsageResult = (periodStart: string, periodEnd: string, result: UsageStats) => {
    const cacheKey = usageCacheKey(provider, range)
    const payload: UsageCachePayload = {
      fetchedAt: new Date().toISOString(),
      periodStart,
      periodEnd,
      stats: result,
    }
    localStorage.setItem(cacheKey, JSON.stringify(payload))
  }

  const fetchOpenAIUsage = async (key: string) => {
    const end = Math.floor(Date.now() / 1000)
    const start = end - rangeToSeconds(range)
    const headers = { Authorization: 'Bearer ' + key }

    const [compData, modData, keyData] = await Promise.all([
      fetchPrimaryOpenAIUsagePages(start, end, headers),
      fetchOpenAIUsagePages(start, end, headers, 'model'),
      fetchOpenAIUsagePages(start, end, headers, 'api_key_id'),
    ])

    let totalReqs = 0
    let totalToks = 0
    const modelsBreakdown: Record<string, number> = {}
    const keysBreakdown: Record<string, number> = {}
    const dailyMap = new Map<string, UsageDailyPoint>()

    ;(compData.data ?? []).forEach((bucket) => {
      const date = usageDateFromUnix(bucket.start_time)
      const requestCount =
        bucket.results?.reduce((sum, result) => sum + Number(result.num_model_requests || 0), 0) ??
        0
      const tokenCount =
        bucket.results?.reduce(
          (sum, result) =>
            sum + Number(result.input_tokens || 0) + Number(result.output_tokens || 0),
          0
        ) ?? 0

      totalReqs += requestCount
      totalToks += tokenCount
      dailyMap.set(date, {
        date,
        tokens: tokenCount,
        requests: requestCount,
        models: {},
      })
    })
    ;(modData.data ?? []).forEach((bucket) => {
      const date = usageDateFromUnix(bucket.start_time)
      const dayEntry = dailyMap.get(date) ?? makeDailyPoint(date)
      dailyMap.set(date, dayEntry)

      bucket.results?.forEach((result) => {
        if (!result.model) return
        const count = Number(result.num_model_requests || 0)
        modelsBreakdown[result.model] = (modelsBreakdown[result.model] || 0) + count
        dayEntry.models[result.model] = (dayEntry.models[result.model] || 0) + count
      })
    })
    ;(keyData.data ?? []).forEach((bucket) => {
      bucket.results?.forEach((result) => {
        if (!result.api_key_id) return
        keysBreakdown[result.api_key_id] =
          (keysBreakdown[result.api_key_id] || 0) +
          Number(result.input_tokens || 0) +
          Number(result.output_tokens || 0)
      })
    })

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    const result: UsageStats = {
      reqs: Number(totalReqs) || 0,
      toks: Number(totalToks) || 0,
      models: modelsBreakdown,
      keys: keysBreakdown,
      daily,
    }
    setStatsCacheKey(usageCacheKey(provider, range))
    setStats(result)
    cacheUsageResult(
      new Date(start * 1000).toISOString(),
      new Date(end * 1000).toISOString(),
      result
    )
  }

  const fetchAnthropicUsage = async (key: string) => {
    const end = new Date()
    const start = new Date(end.getTime() - rangeToSeconds(range) * 1000)
    const headers = {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }

    const [usageData, modelData, keyData] = await Promise.all([
      fetchPrimaryAnthropicUsagePages(start.toISOString(), end.toISOString(), headers),
      fetchAnthropicUsagePages(start.toISOString(), end.toISOString(), headers, 'model'),
      fetchAnthropicUsagePages(start.toISOString(), end.toISOString(), headers, 'api_key_id'),
    ])

    let totalReqs = 0
    let totalToks = 0
    const modelsBreakdown: Record<string, number> = {}
    const keysBreakdown: Record<string, number> = {}
    const dailyMap = new Map<string, UsageDailyPoint>()

    ;(usageData.data ?? []).forEach((bucket) => {
      const date = usageDateFromRFC3339(bucket.starting_at)
      const requestCount =
        bucket.results?.reduce((sum, result) => sum + Number(result.requests || 0), 0) ?? 0
      const tokenCount =
        bucket.results?.reduce((sum, result) => sum + toAnthropicTokenCount(result), 0) ?? 0

      totalReqs += requestCount
      totalToks += tokenCount
      dailyMap.set(date, {
        date,
        tokens: tokenCount,
        requests: requestCount,
        models: {},
      })
    })
    ;(modelData.data ?? []).forEach((bucket) => {
      const date = usageDateFromRFC3339(bucket.starting_at)
      const dayEntry = dailyMap.get(date) ?? makeDailyPoint(date)
      dailyMap.set(date, dayEntry)

      bucket.results?.forEach((result) => {
        if (!result.model) return
        const count = Number(result.requests || 0)
        modelsBreakdown[result.model] = (modelsBreakdown[result.model] || 0) + count
        dayEntry.models[result.model] = (dayEntry.models[result.model] || 0) + count
      })
    })
    ;(keyData.data ?? []).forEach((bucket) => {
      bucket.results?.forEach((result) => {
        if (!result.api_key_id) return
        keysBreakdown[result.api_key_id] =
          (keysBreakdown[result.api_key_id] || 0) + toAnthropicTokenCount(result)
      })
    })

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    const result: UsageStats = {
      reqs: Number(totalReqs) || 0,
      toks: Number(totalToks) || 0,
      models: modelsBreakdown,
      keys: keysBreakdown,
      daily,
    }
    setStatsCacheKey(usageCacheKey(provider, range))
    setStats(result)
    cacheUsageResult(start.toISOString(), end.toISOString(), result)
  }

  const fetchUsage = async () => {
    const key = provider === 'openai' ? apiKey.trim() : anthropicApiKey.trim()
    if (!key) {
      setError(`Please enter a ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} Admin API Key.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      if (provider === 'openai') {
        await fetchOpenAIUsage(key)
      } else {
        await fetchAnthropicUsage(key)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage')
    } finally {
      setLoading(false)
    }
  }

  const activeCacheKey = usageCacheKey(provider, range)
  const visibleStats = statsCacheKey === activeCacheKey ? stats : readCachedStats(activeCacheKey)

  return { apiKey, setApiKey, loading, error, stats: visibleStats, fetchUsage }
}
