import { useCallback, useEffect, useRef, useState } from 'react'

import type { Collection, DeviceCodeResponse, GitHubAuthStatus } from '@/types'

type State = {
  status: GitHubAuthStatus | null
  collection: Collection | null
  loading: boolean
  error: string | null
}

export function useCollection() {
  const [state, setState] = useState<State>({
    status: null,
    collection: null,
    loading: true,
    error: null,
  })
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async (): Promise<GitHubAuthStatus> => {
    const resp = await fetch('/api/github/status')
    const status: GitHubAuthStatus = await resp.json()
    return status
  }, [])

  const loadCollection = useCallback(async (status: GitHubAuthStatus) => {
    if (!status.authenticated) {
      setState({ status, collection: null, loading: false, error: null })
      return
    }
    try {
      const resp = await fetch('/api/collection')
      if (!resp.ok) throw new Error(`collection ${resp.status}`)
      const collection: Collection = await resp.json()
      setState({ status, collection, loading: false, error: null })
    } catch (e) {
      setState({ status, collection: null, loading: false, error: (e as Error).message })
    }
  }, [])

  const refresh = useCallback(async () => {
    const status = await fetchStatus()
    await loadCollection(status)
  }, [fetchStatus, loadCollection])

  useEffect(() => {
    void (async () => {
      await refresh()
    })()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [refresh])

  const startLogin = useCallback(async () => {
    const resp = await fetch('/api/github/device', { method: 'POST' })
    if (!resp.ok) throw new Error(`device ${resp.status}`)
    const dc: DeviceCodeResponse = await resp.json()
    setDeviceCode(dc)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(
      async () => {
        const status = await fetchStatus()
        if (status.authenticated) {
          if (pollRef.current) clearInterval(pollRef.current)
          setDeviceCode(null)
          await loadCollection(status)
        }
      },
      (dc.interval || 5) * 1000
    )
  }, [fetchStatus, loadCollection])

  const logout = useCallback(async () => {
    await fetch('/api/github/logout', { method: 'POST' })
    await refresh()
  }, [refresh])

  // cancelLogin aborts an in-progress device flow (user dismissed the modal).
  const cancelLogin = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
    setDeviceCode(null)
  }, [])

  const install = useCallback(
    async (id: string) => {
      const resp = await fetch('/api/collection/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!resp.ok) throw new Error(`install ${resp.status}`)
      await refresh()
    },
    [refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      const resp = await fetch(`/api/collection?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error(`remove ${resp.status}`)
      await refresh()
    },
    [refresh]
  )

  return { ...state, deviceCode, startLogin, cancelLogin, logout, install, remove, refresh }
}
