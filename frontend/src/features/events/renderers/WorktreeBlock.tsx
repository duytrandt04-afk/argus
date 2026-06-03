type WorktreeBlockProps = {
  branch?: string
  hookEventName?: string
}

export function WorktreeBlock({ branch, hookEventName }: WorktreeBlockProps) {
  if (!branch) return null

  const isCreate = hookEventName === 'WorktreeCreate'

  return (
    <div className="mt-1 text-[0.72rem] text-[#888]">
      <span className="text-[#555] mr-1">branch</span>
      <span className={isCreate ? 'text-[#47ff9c]' : 'text-[#ff6b6b]'}>{branch}</span>
    </div>
  )
}
