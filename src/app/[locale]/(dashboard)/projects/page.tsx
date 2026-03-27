'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/routing'
import { Plus, FolderKanban } from 'lucide-react'
import { useState } from 'react'
import type { ProjectStatus } from '@/types'

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Completados' },
  { value: 'archived', label: 'Archivados' },
]

export default function ProjectsPage() {
  const t = useTranslations('projects')
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('active')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const filtered = projects?.filter(
    (p) => filter === 'all' || p.status === filter
  ) ?? []

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Header
        title={t('title')}
        actions={
          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t('newProject')}
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                filter === value
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('noProjects')}</p>
            <Link href="/projects/new">
              <Button size="sm" variant="outline">
                {t('createNew')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
