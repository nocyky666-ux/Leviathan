'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Build } from '@/types'

const TERMINAL_STATUSES = ['success', 'failed', 'cancelled', 'timeout']
const POLL_INTERVAL = 5000  // 5 seconds

interface UseBuildResult {
  build: Build | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useBuild(buildId: string | null, pollWhileActive = true): UseBuildResult {
  const [build, setBuild] = useState<Build | null>(null)
  const [loading, setLoading] = useState(!!buildId)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const fetchStatus = useCallback(async () => {
    if (!buildId) return
    try {
      const res = await fetch(`/api/status/${buildId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to fetch build status')
        return
      }
      const data = await res.json()
      if (mountedRef.current) {
        setBuild(data.build)
        setError(null)
      }
    } catch {
      if (mountedRef.current) setError('Network error')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [buildId])

  useEffect(() => {
    mountedRef.current = true

    if (!buildId) {
      setBuild(null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchStatus()

    // Poll if build is active
    const schedule = () => {
      if (!mountedRef.current) return
      timerRef.current = setTimeout(async () => {
        await fetchStatus()
        setBuild(prev => {
          if (!prev || TERMINAL_STATUSES.includes(prev.status)) return prev
          if (pollWhileActive) schedule()
          return prev
        })
      }, POLL_INTERVAL)
    }

    if (pollWhileActive) schedule()

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [buildId, pollWhileActive, fetchStatus])

  // Stop polling once terminal
  useEffect(() => {
    if (build && TERMINAL_STATUSES.includes(build.status)) {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [build])

  return { build, loading, error, refetch: fetchStatus }
}

// ─────────────────────────────────────────────────────────────
// useBuilds — list for a session
// ─────────────────────────────────────────────────────────────
export function useBuilds(sessionId: string | null) {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/builds?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.builds) setBuilds(data.builds)
    } catch {}
    finally { setLoading(false) }
  }, [sessionId])

  useEffect(() => { fetch_() }, [fetch_])

  return { builds, loading, refetch: fetch_ }
}
