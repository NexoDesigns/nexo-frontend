'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { ProjectTile } from '@/components/projects/ProjectTile'
import { ProjectsTable } from '@/components/projects/ProjectsTable'
import { useProjectStages } from '@/components/projects/StageStepper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Link } from '@/i18n/routing'
import { Plus, FolderKanban, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types'

type StatusFilter = ProjectStatus | 'all'
type SortKey = 'edited' | 'name'
type ViewMode = 'tiles' | 'table'

const VIEW_STORAGE_KEY = 'nexo.projects.view'

const selectTriggerClass = 'h-8 w-auto gap-2 rounded-[5px] bg-card px-2.5 text-[12.5px] shadow-none'

function TilesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="6" height="6" rx="1" />
      <rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="0" y="1" width="14" height="2" rx="1" />
      <rect x="0" y="6" width="14" height="2" rx="1" />
      <rect x="0" y="11" width="14" height="2" rx="1" />
    </svg>
  )
}

export default function ProjectsPage() {
  const tProjects = useTranslations('projects')
  const tStatus = useTranslations('status')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('active')
  const [sort, setSort] = useState<SortKey>('edited')
  const [view, setView] = useState<ViewMode>('tiles')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY)
      if (saved === 'tiles' || saved === 'table') setView(saved)
    } catch {}
  }, [])

  const changeView = (next: ViewMode) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next)
    } catch {}
  }

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })
  const stages = useProjectStages()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (projects ?? []).filter(
      (p) =>
        (filter === 'all' || p.status === filter) &&
        (!q || p.name.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q))
    )
    return matches.sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [projects, query, filter, sort])

  const hasProjects = (projects?.length ?? 0) > 0

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <Header title={tProjects('title')} meta={projects ? projects.length : undefined} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-6">
        <label className="flex h-8 w-[260px] items-center gap-2 rounded-[5px] border border-input bg-sidebar px-2.5 focus-within:ring-1 focus-within:ring-ring">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tProjects('searchPlaceholder')}
            aria-label={tProjects('searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-[#6F7A8B]"
          />
        </label>

        <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
          <SelectTrigger className={selectTriggerClass} aria-label={tStatus('status')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tProjects('allStatuses')}</SelectItem>
            <SelectItem value="active">{tStatus('active')}</SelectItem>
            <SelectItem value="completed">{tStatus('completed')}</SelectItem>
            <SelectItem value="archived">{tStatus('archived')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          {tProjects('sort')}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className={selectTriggerClass} aria-label={tProjects('sort')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="edited">{tProjects('sortLastEdited')}</SelectItem>
              <SelectItem value="name">{tProjects('sortName')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <div className="flex rounded-md border border-input bg-sidebar p-0.5" role="group">
          {([
            { mode: 'tiles', label: tProjects('viewTiles'), Icon: TilesIcon },
            { mode: 'table', label: tProjects('viewTable'), Icon: TableIcon },
          ] as const).map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeView(mode)}
              title={label}
              aria-label={label}
              aria-pressed={view === mode}
              className={cn(
                'flex h-6 w-[30px] items-center justify-center rounded text-foreground transition-colors',
                view === mode ? 'bg-accent' : 'hover:bg-card'
              )}
            >
              <Icon />
            </button>
          ))}
        </div>

        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            {tProjects('newProject')}
          </Link>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-7 pt-[18px]">
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[150px] rounded-lg" />
            ))}
          </div>
        ) : !hasProjects ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{tProjects('noProjects')}</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/projects/new">{tProjects('createNew')}</Link>
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto mt-[60px] flex max-w-[360px] flex-col gap-2 text-center">
            <div className="text-sm font-semibold text-foreground">{tProjects('noMatchTitle')}</div>
            <div className="text-[13px] text-muted-foreground">{tProjects('noMatchHint')}</div>
          </div>
        ) : view === 'tiles' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {rows.map((project) => (
              <ProjectTile key={project.id} project={project} stages={stages} />
            ))}
          </div>
        ) : (
          <ProjectsTable projects={rows} stages={stages} />
        )}
      </div>
    </div>
  )
}
