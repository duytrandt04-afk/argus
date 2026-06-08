import { useVersion } from './useVersion'

export function VersionBadge() {
  const info = useVersion()
  if (!info) return null

  const short = info.commit !== 'none' ? info.commit.slice(0, 7) : null
  const v = info.version.startsWith('v') ? info.version : `v${info.version}`
  const label = short ? `${v} (${short})` : v

  return (
    <span
      className="whitespace-nowrap text-[0.66rem] font-medium leading-none text-[#444]"
      aria-label={`Application version: ${label}`}
    >
      {label}
    </span>
  )
}
