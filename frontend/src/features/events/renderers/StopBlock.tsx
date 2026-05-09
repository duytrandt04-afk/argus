import { CopyIconButton } from './CopyIconButton'

type StopBlockProps = {
  response: string
}

export function StopBlock({ response }: StopBlockProps) {
  if (!response) return null

  return (
    <div className="group/eblock mt-2 bg-black/30 border border-white/[0.05] px-3 py-2 rounded-[6px]">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-[#aaa] text-[0.7rem]">Response</strong>
        <CopyIconButton
          text={response}
          label="response"
          className="opacity-0 group-hover/eblock:opacity-100 focus-visible:opacity-100"
        />
      </div>
      <pre className="mt-1 mb-0 max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words font-[inherit] text-[0.75rem] text-[#a0a0a0]">
        {response}
      </pre>
    </div>
  )
}
