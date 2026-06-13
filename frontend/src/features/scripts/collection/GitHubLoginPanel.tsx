import { Button } from '@/components/ui/button'

type GitHubLoginPanelProps = {
  onLogin: () => void
  busy: boolean
}

export function GitHubLoginPanel({ onLogin, busy }: GitHubLoginPanelProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-white/[0.06] px-6 py-12 text-center">
      <p className="text-sm text-[#aaa]">
        Log in with GitHub to keep a portable collection of your hook scripts.
      </p>
      <p className="max-w-md text-xs text-[#777]">
        Your scripts are stored in your own private gist (scope: gist). argus stores nothing — the
        token stays on this machine.
      </p>
      <Button size="sm" disabled={busy} onClick={onLogin}>
        Login with GitHub
      </Button>
    </div>
  )
}
