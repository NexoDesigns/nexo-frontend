'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { projectsApi, documentsApi } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/routing'
import { Plus, FolderKanban, BookOpen, Activity } from 'lucide-react'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tNav = useTranslations('nav')

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const { data: documents } = useQuery({
    queryKey: ['documents-global'],
    queryFn: () => documentsApi.list(),
  })

  const activeProjects = projects?.filter((p) => p.status === 'active') ?? []
  const recentProjects = [...(projects ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)

  const stats = [
    {
      label: t('totalProjects'),
      value: projects?.length ?? 0,
      icon: FolderKanban,
    },
    {
      label: t('activeProjects'),
      value: activeProjects.length,
      icon: Activity,
    },
    {
      label: t('documentsIndexed'),
      value: documents?.filter((d) => d.embedding_status === 'done').length ?? 0,
      icon: BookOpen,
    },
  ]

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Header
        title={t('title')}
        actions={
          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {useTranslations('projects')('newProject')}
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground leading-none">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">
              {t('recentProjects')}
            </h2>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                Ver todos
              </Button>
            </Link>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <FolderKanban className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t('noProjects')}</p>
              <Link href="/projects/new">
                <Button size="sm" variant="outline">
                  {t('createFirst')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
