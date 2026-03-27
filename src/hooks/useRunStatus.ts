'use client'

import { useEffect, useRef, useState } from 'react'
import { runsApi } from '@/lib/api'
import type { PhaseRun } from '@/types'
import { isTerminalStatus } from '@/lib/utils'

interface UseRunStatusOptions {
  projectId: string
  phaseId: string
  runId: string | null
  intervalMs?: number
  onComplete?: (run: PhaseRun) => void
  onError?: (run: PhaseRun) => void
}

export function useRunStatus({
  projectId,
  phaseId,
  runId,
  intervalMs = 5000,
  onComplete,
  onError,
}: UseRunStatusOptions) {
  const [run, setRun] = useState<PhaseRun | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!runId) return

    // Immediate first fetch
    const poll = async () => {
      try {
        const data = await runsApi.get(projectId, phaseId, runId)
        setRun(data)
        setFetchError(null)

        if (isTerminalStatus(data.status)) {
          clearPolling()
          if (data.status === 'completed') onComplete?.(data)
          if (data.status === 'failed') onError?.(data)
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, intervalMs)

    return clearPolling
  }, [runId, projectId, phaseId, intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    run,
    isPolling: !!intervalRef.current,
    fetchError,
  }
}
