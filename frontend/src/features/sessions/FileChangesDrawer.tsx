import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { FileChangeGroup } from '@/types/sessions'
import { FileChangesList } from './FileChangesList'

type FileChangesDrawerProps = {
  sessionId: string
  sessionStartedAt: string
  groups: FileChangeGroup[]
  loading: boolean
  error: string | null
  onClose: () => void
}

export function FileChangesDrawer({
  sessionId,
  sessionStartedAt,
  groups,
  loading,
  error,
  onClose,
}: FileChangesDrawerProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0d0d0d] text-white shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.6)]">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
            File changes
          </div>
          <div className="mt-0.5 truncate font-mono text-[12px] text-white/60">
            {sessionId.slice(0, 12)}
          </div>
        </div>
        {!loading && groups.length > 0 && (
          <Badge
            variant="outline"
            className="shrink-0 border-white/15 bg-white/[0.06] text-[11px] text-white/70"
          >
            {groups.length} {groups.length === 1 ? 'file' : 'files'}
          </Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-white/45 hover:bg-white/10 hover:text-white"
          onClick={onClose}
          aria-label="Close file changes"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator className="shrink-0 bg-white/10" />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb:hover]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent">
        <FileChangesList
          groups={groups}
          sessionStartedAt={sessionStartedAt}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}
