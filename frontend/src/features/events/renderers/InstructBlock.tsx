import type { ReactNode } from 'react'
import { highlight } from '@/lib/format'

type InstructBlockProps = {
  memoryType?: string
  loadReason?: string
  searchQuery?: string
}

export function InstructBlock({ memoryType, loadReason, searchQuery = '' }: InstructBlockProps) {
  if (!memoryType && !loadReason) return null

  return (
    <div className="mt-2 text-[0.75rem] text-[#ccc] bg-black/30 border border-white/[0.05] px-3 py-2 rounded-[6px]">
      {memoryType && (
        <div>
          <strong className="text-[#aaa] text-[0.7rem] mr-1">type</strong>
          <span className="text-[#888]">{highlight(memoryType, searchQuery) as ReactNode}</span>
        </div>
      )}
      {loadReason && (
        <div className="mt-1">
          <strong className="text-[#aaa] text-[0.7rem] mr-1">reason</strong>
          <span className="text-[#888]">{highlight(loadReason, searchQuery) as ReactNode}</span>
        </div>
      )}
    </div>
  )
}
