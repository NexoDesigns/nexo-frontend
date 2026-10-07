'use client'

import { use } from 'react'
import { useProject } from '@/hooks/useProject'
import { DescripcionView } from '@/components/projects/DescripcionView'

export default function ProjectDescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project } = useProject(id)
  if (!project) return null

  return (
    <div className="flex-1">
      <DescripcionView projectId={id} project={project} />
    </div>
  )
}
