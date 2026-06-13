import { useVersion } from './useVersion'

export function VersionBadge() {
  const info = useVersion()
  if (!info) return null

  const raw = info.version.startsWith('v') ? info.version : `v${info.version}`
  // Strip the git-describe suffix (-<N>-g<hash>[-dirty]) so a dev build off a
  // release tag still shows a clean version (e.g. v0.1.2, not v0.1.2-26-g1626c6f).
  const label = raw.replace(/-\d+-g[0-9a-f]+(-dirty)?$/, '')

  return (
    <span
      className="whitespace-nowrap text-[0.66rem] font-medium leading-none text-[#444]"
      aria-label={`Application version: ${label}`}
    >
      {label}
    </span>
  )
}
