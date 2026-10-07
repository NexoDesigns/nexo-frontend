'use client'

import { use } from 'react'
import { useProject } from '@/hooks/useProject'
import { RequirementsView } from '@/components/projects/RequirementsView'

export default function ProjectRequirementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project } = useProject(id)
  if (!project) return null

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <RequirementsView projectId={id} project={project} />
    </div>
  )
}
