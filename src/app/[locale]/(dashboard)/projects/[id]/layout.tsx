'use client'

import { use } from 'react'
import { useTranslations } from 'next-intl'
import { useProject } from '@/hooks/useProject'
import { ProjectTabs } from '@/components/projects/ProjectTabs'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const t = useTranslations('projects')
  const { data: project, isLoading } = useProject(id)

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square flex-1 rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t('notFound')}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <ProjectTabs projectId={id} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  )
}
