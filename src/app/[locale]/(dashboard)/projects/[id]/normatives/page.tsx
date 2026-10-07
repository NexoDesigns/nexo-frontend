'use client'

import { use } from 'react'
import { useProject } from '@/hooks/useProject'
import { NormativasView } from '@/components/projects/NormativasView'

export default function ProjectNormativesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project } = useProject(id)
  if (!project) return null

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <NormativasView projectId={id} project={project} />
    </div>
  )
}
