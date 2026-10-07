import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import type { PhaseRun, PipelinePhase } from '@/types'

export type PhaseRunState = 'done' | 'running' | 'failed' | 'not_started'

export interface PhaseState {
  state: PhaseRunState
  /** The previous phase in the project's list has no active run yet */
  locked: boolean
  /** First phase without an active run — the one to work on next */
  isCurrent: boolean
  activeRunId: string | null
  activeRunNumber: number | null
}

const isInFlight = (r: PhaseRun) => r.status === 'pending' || r.status === 'running'

export function useActiveRuns(projectId: string) {
  return useQuery({
    queryKey: ['active-runs', projectId],
    queryFn: () => runsApi.getActiveRuns(projectId),
    refetchInterval: 10_000,
  })
}

/** Runs of one phase, polled while one of them is in flight. */
export function usePhaseRuns(projectId: string, phaseId: string) {
  return useQuery({
    queryKey: ['runs', projectId, phaseId],
    queryFn: () => runsApi.list(projectId, phaseId),
    refetchInterval: (query) => (query.state.data?.some(isInFlight) ? 5_000 : false),
  })
}

/** Derived run state of every phase of a project, in the order given. */
export function usePipelineState(projectId: string, phases: PipelinePhase[]) {
  const { data: activeRuns, isLoading: activeLoading } = useActiveRuns(projectId)

  const runQueries = useQueries({
    queries: phases.map((phase) => ({
      queryKey: ['runs', projectId, phase.id],
      queryFn: () => runsApi.list(projectId, phase.id),
      refetchInterval: (query: { state: { data?: PhaseRun[] } }) =>
        query.state.data?.some(isInFlight) ? 5_000 : false,
    })),
  })

  const runsData = runQueries.map((q) => q.data)
  const runsLoading = runQueries.some((q) => q.isLoading)
  // Stable change signal for the run lists (the query array itself is new every render)
  const runsVersion = runQueries.map((q) => q.dataUpdatedAt).join('|')

  const states = useMemo(() => {
    const result: Record<string, PhaseState> = {}
    let currentFound = false

    phases.forEach((phase, idx) => {
      const runs = runsData[idx] ?? []
      const activeRunId = activeRuns?.find((a) => a.phase_id === phase.id)?.run_id ?? null
      const latest = runs.reduce<PhaseRun | undefined>(
        (max, r) => (!max || r.run_number > max.run_number ? r : max),
        undefined
      )

      const state: PhaseRunState = runs.some(isInFlight)
        ? 'running'
        : activeRunId
        ? 'done'
        : latest?.status === 'failed'
        ? 'failed'
        : 'not_started'

      const prev = idx > 0 ? phases[idx - 1] : undefined
      const prevHasActive = !prev || activeRuns?.some((a) => a.phase_id === prev.id)

      const isCurrent = !activeRunId && !currentFound
      if (isCurrent) currentFound = true

      result[phase.id] = {
        state,
        locked: !prevHasActive && state !== 'done' && state !== 'running',
        isCurrent,
        activeRunId,
        activeRunNumber: activeRunId
          ? runs.find((r) => r.id === activeRunId)?.run_number ?? null
          : null,
      }
    })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases, activeRuns, runsVersion])

  return { states, isLoading: activeLoading || runsLoading }
}
