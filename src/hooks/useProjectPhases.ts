import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { phasesApi } from '@/lib/api'
import type { PipelinePhase, Project } from '@/types'

/**
 * The pipeline phases that apply to a project, in order.
 *
 * Swap point for per-project phase subsets: today every project uses every
 * phase from /pipeline-phases. When projects get their own phase list, filter
 * `allPhases` here — every tile, route and "previous phase" check reads from it.
 */
export function getProjectPhases(
  _project: Project | undefined,
  allPhases: PipelinePhase[]
): PipelinePhase[] {
  return [...allPhases].sort((a, b) => a.order_index - b.order_index)
}

export function usePipelinePhases() {
  return useQuery({
    queryKey: ['phases'],
    queryFn: phasesApi.list,
    staleTime: Infinity, // phases never change during a session
  })
}

export function useProjectPhases(project?: Project) {
  const { data, isLoading } = usePipelinePhases()
  const phases = useMemo(() => getProjectPhases(project, data ?? []), [project, data])

  const has = useCallback((phaseId: string) => phases.some((p) => p.id === phaseId), [phases])

  /** The phase before `phaseId` in this project's list (its upstream input), if any. */
  const getPrevious = useCallback(
    (phaseId: string): PipelinePhase | undefined => {
      const idx = phases.findIndex((p) => p.id === phaseId)
      return idx > 0 ? phases[idx - 1] : undefined
    },
    [phases]
  )

  return { phases, isLoading, has, getPrevious }
}
