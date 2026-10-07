import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { parseResearchOutput } from '@/lib/research'
import { useCustomOutputs } from '@/hooks/useCustomOutputs'
import type { CustomOutputItem, ResearchSolution } from '@/types'

export interface CustomSolution {
  item: CustomOutputItem
  solution: ResearchSolution
}

/** One research run with its solutions: the AI originals and the user's custom ones. */
export function useResearchRun(projectId: string, runId: string | null) {
  const { data: run, isLoading } = useQuery({
    queryKey: ['run', projectId, 'research', runId],
    queryFn: () => runsApi.get(projectId, 'research', runId!),
    enabled: !!runId,
  })
  const customOutputs = useCustomOutputs(projectId, 'research', runId)

  const items = useMemo(() => parseResearchOutput(run?.output_payload), [run?.output_payload])
  const originals = useMemo(() => items.flatMap((item) => item.solutions), [items])
  const customs = useMemo<CustomSolution[]>(
    () =>
      customOutputs.items.map((item) => {
        const data = item.data as Partial<ResearchSolution>
        return {
          item,
          solution: {
            id: String(data.id ?? ''),
            title: String(data.title ?? ''),
            description: String(data.description ?? ''),
            key_references: Array.isArray(data.key_references) ? data.key_references.map(String) : [],
          },
        }
      }),
    [customOutputs.items]
  )
  const allSolutions = useMemo(
    () => [...originals, ...customs.map((c) => c.solution)],
    [originals, customs]
  )

  return { run, isLoading, items, originals, customs, allSolutions, customOutputs }
}
