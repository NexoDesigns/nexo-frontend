'use client'

import { use, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { useProject } from '@/hooks/useProject'
import { useProjectPhases } from '@/hooks/useProjectPhases'
import { GenericPhasePage, PHASE_PAGES } from '@/components/pipeline/phases'
import { Skeleton } from '@/components/ui/skeleton'
import type { PhaseId } from '@/types'

export default function PhasePage({ params }: { params: Promise<{ id: string; phaseId: string }> }) {
  const { id, phaseId } = use(params)
  const router = useRouter()
  const { data: project } = useProject(id)
  const { phases, isLoading } = useProjectPhases(project)
  const phase = phases.find((p) => p.id === phaseId)

  // Phases that aren't part of this project don't exist for it: go back to the overview.
  useEffect(() => {
    if (!isLoading && project && !phase) router.replace(`/projects/${id}/pipeline`)
  }, [isLoading, project, phase, id, router])

  if (!project || !phase) {
    return (
      <div className="space-y-4 px-7 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  const Page = PHASE_PAGES[phase.id as PhaseId] ?? GenericPhasePage
  return <Page project={project} phase={phase} />
}
