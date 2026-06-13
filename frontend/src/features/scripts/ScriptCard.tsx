import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ScriptPackage } from '@/types'

import { ScriptSourceDialog } from './ScriptSourceDialog'

type ScriptCardProps = {
  script: ScriptPackage
  onInstall: (id: string) => void
  onDelete: (id: string) => void
  busy: boolean
}

export function ScriptCard({ script, onInstall, onDelete, busy }: ScriptCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{script.title}</CardTitle>
          {script.installed ? (
            <Badge variant="secondary">Added</Badge>
          ) : (
            <Badge variant="outline">Available</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{script.purpose}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{script.event}</Badge>
          {script.matcher ? <Badge variant="outline">{script.matcher}</Badge> : null}
          <Badge variant="outline">{script.tier === 'official' ? 'Official' : script.tier}</Badge>
        </div>
        {!script.runtime_available ? (
          <p className="text-xs text-amber-600">Needs `{script.runtime}` installed to run.</p>
        ) : null}
        <div className="flex gap-2">
          <ScriptSourceDialog script={script} />
          {script.installed ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => onDelete(script.id)}
            >
              Delete
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => onInstall(script.id)}>
              Install
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
