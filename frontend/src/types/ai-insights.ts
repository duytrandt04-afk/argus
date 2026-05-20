export interface AIInsightSummary {
  session_id: string
  agent: string
  cwd: string
  transcript_path: string
  summary: string
  model: string
  created_at: string
  updated_at: string
  last_seen_at: string
}

export interface AIInsightObservation {
  session_id: string
  tool_use_id: string
  tool_name: string
  observation: string
  model: string
  created_at: string
  agent: string
  cwd: string
  event_time: string
  action: string
  path: string
}

export interface AIInsightsResponse {
  summaries: AIInsightSummary[]
  observations: AIInsightObservation[]
}
