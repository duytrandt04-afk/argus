import type { AgentConfig } from '../types';

export const codexAgent: AgentConfig = {
  id: 'codex',
  label: 'Codex',
  badgeClass: 'codex',
  supportsSessionUsage: false,
  matchesEvent: () => true,
};
