export type AgentId = 'claudecode' | 'codex';

export type EventRecord = {
  transcript_path?: string;
  session?: string;
};

export type SessionUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  turns: number;
};

export type UsageTooltipItem = {
  cls: string;
  label: string;
  tip: string;
};

export type AgentConfig = {
  id: AgentId;
  label: string;
  badgeClass: string;
  supportsSessionUsage: boolean;
  matchesEvent: (event: EventRecord) => boolean;
  buildUsageItems?: (
    usage: SessionUsage,
    formatTokens: (n: number) => string
  ) => UsageTooltipItem[];
};
