import { useDiagnostics } from './hooks/useDiagnostics'

export function DiagnosticsPage() {
  const { reload } = useDiagnostics()
  void reload // will be wired in Plan 02
  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <h1 className="text-[22px] font-semibold text-foreground">Diagnostics</h1>
      </div>
    </div>
  )
}
