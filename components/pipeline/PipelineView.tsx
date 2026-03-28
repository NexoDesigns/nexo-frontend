'use client'

import { useQuery } from '@tanstack/react-query'
import { runsApi, phasesApi } from '@/lib/api'
import { PhaseCard } from './PhaseCard'
import { Skeleton } from '@/components/ui/skeleton'
import { PHASE_ORDER } from '@/lib/utils'
import type { PhaseId, ProjectActiveRun } from '@/types'
import { ArrowRight } from 'lucide-react'

interface PipelineViewProps {
  projectId: string
}

export function PipelineView({ projectId }: PipelineViewProps) {
  const { data: phases, isLoading: phasesLoading } = useQuery({
    queryKey: ['phases'],
    queryFn: phasesApi.list,
    staleTime: Infinity, // phases never change
  })

  const { data: activeRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['active-runs', projectId],
    queryFn: () => runsApi.getActiveRuns(projectId),
    refetchInterval: 10_000, // refresh active run state every 10s
  })

  const isLoading = phasesLoading || runsLoading

  if (isLoading) {
    return (
      <div className="space-y-3">
        {PHASE_ORDER.map((id) => (
          <Skeleton key={id} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // Build a lookup: phaseId → active PhaseRun (we need to fetch each run detail)
  const activeRunMap: Partial<Record<PhaseId, ProjectActiveRun>> = {}
  activeRuns?.forEach((ar) => {
    activeRunMap[ar.phase_id] = ar
  })

  // Sort phases by order_index
  const sortedPhases = [...(phases ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  return (
    <div className="space-y-2">
      {sortedPhases.map((phase, idx) => (
        <div key={phase.id} className="relative">
          <PhaseCard
            phase={phase}
            projectId={projectId}
            activeRunId={activeRunMap[phase.id]?.run_id ?? null}
          />
          {/* Connector arrow between phases */}
          {idx < sortedPhases.length - 1 && (
            <div className="flex justify-center py-0.5">
              <ArrowRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
