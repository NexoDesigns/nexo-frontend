'use client'

import { use } from 'react'
import { useProject } from '@/hooks/useProject'
import { PipelineOverview } from '@/components/pipeline/PipelineOverview'

export default function ProjectPipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project } = useProject(id)
  if (!project) return null

  return (
    <PipelineOverview project={project} />
  )
}
