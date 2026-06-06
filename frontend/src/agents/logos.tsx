import { Claude, Codex } from '@lobehub/icons'

export function AnthropicLogo({ size = 14 }: { size?: number }) {
  return <Claude.Avatar size={size} />
}

export function OpenAILogo({ size = 14 }: { size?: number }) {
  return <Codex.Avatar size={size} />
}
