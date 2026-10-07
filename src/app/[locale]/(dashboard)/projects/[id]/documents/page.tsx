'use client'

import { use } from 'react'
import { useProject } from '@/hooks/useProject'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { DocumentList } from '@/components/documents/DocumentList'

export default function ProjectDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: project } = useProject(id)
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.list({ project_id: id }),
  })

  if (!project) return null

  return (
    <div className="flex-1 p-6">
      <DocumentList
        documents={documents ?? []}
        isLoading={isLoading}
        queryKey={['documents', id]}
        projectId={id}
        projectName={project.name}
      />
    </div>
  )
}
