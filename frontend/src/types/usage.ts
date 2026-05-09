export interface OpenAIBucketResult {
  num_model_requests?: number
  input_tokens?: number
  output_tokens?: number
  model?: string | null
  api_key_id?: string | null
}

export interface OpenAIBucket {
  start_time: number
  end_time: number
  results?: OpenAIBucketResult[]
}

export interface OpenAIUsageResponse {
  data?: OpenAIBucket[]
  has_more?: boolean
  next_page?: string | null
  page?: string
  error?: { message?: string }
}

export interface AnthropicUsageResult {
  model?: string | null
  api_key_id?: string | null
  requests?: number
  uncached_input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation?: {
    ephemeral_1h_input_tokens?: number
    ephemeral_5m_input_tokens?: number
  }
}

export interface AnthropicUsageBucket {
  starting_at: string
  ending_at: string
  results?: AnthropicUsageResult[]
}

export interface AnthropicUsageResponse {
  data?: AnthropicUsageBucket[]
  has_more?: boolean
  next_page?: string | null
  error?: { message?: string }
}

export interface UsageDailyPoint {
  date: string
  tokens: number
  requests: number
  models: Record<string, number>
}

export interface UsageStats {
  reqs: number
  toks: number
  models: Record<string, number>
  keys: Record<string, number>
  daily: UsageDailyPoint[]
}
