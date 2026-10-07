'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter, Link } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import { projectsApi } from '@/lib/api'
import { usePipelinePhases } from '@/hooks/useProjectPhases'
import { PROJECT_TABS, useProjectTabLabel, type ProjectTab } from '@/components/projects/ProjectTabs'
import { usePhaseName } from '@/components/pipeline/usePhaseName'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/primitives'
import { NexoLogo } from '@/components/public/NexoLogo'
import { UserAvatar } from './UserAvatar'

function UpDownChevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-muted-foreground" aria-hidden="true">
      <path d="M3 4l2-2 2 2M3 6l2 2 2-2" />
    </svg>
  )
}

function Slash() {
  return <span className="text-lg font-light text-border" aria-hidden="true">/</span>
}

export function TopBar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const { data: allPhases } = usePipelinePhases()
  const tabLabel = useProjectTabLabel()
  const phaseName = usePhaseName()

  // /projects/{id}/{tab}/{phaseId}
  const [, , currentId, tabSegment, phaseSegment] = pathname.split('/')
  const currentProject =
    pathname.startsWith('/projects/') && currentId && currentId !== 'new'
      ? projects?.find((p) => p.id === currentId)
      : undefined
  const tab = PROJECT_TABS.find((t) => t.id === tabSegment)?.id as ProjectTab | undefined
  const phase =
    tab === 'pipeline' && phaseSegment ? allPhases?.find((p) => p.id === phaseSegment) : undefined

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
      <Link href="/" className="flex items-center gap-2.5">
        <NexoLogo className="h-6 w-6 rounded" />
        <span className="flex gap-[5px] whitespace-nowrap text-sm text-foreground">
          <span className="font-bold tracking-[.04em]">NEXO</span>
          <span className="text-muted-foreground">Design</span>
        </span>
      </Link>

      <Slash />

      {/* Organisation: static until multi-tenant SaaS lands (TODO: org switcher). */}
      <span className="flex h-[30px] items-center gap-2 whitespace-nowrap px-2 text-[13px] font-medium text-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#3A2A1E] text-[10px] font-bold text-[#F0A56B]">
          N
        </span>
        {t('org')}
      </span>

      <Slash />

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex h-[30px] max-w-[280px] items-center gap-2 whitespace-nowrap rounded-[5px] px-2 text-[13px] outline-none transition-colors hover:bg-card focus-visible:ring-1 focus-visible:ring-ring',
            currentProject ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="truncate">{currentProject?.name ?? t('selectProject')}</span>
          <UpDownChevron />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
          {projects && projects.length > 0 ? (
            projects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => router.push(`/projects/${p.id}`)}
                className={cn('text-[13px]', p.id === currentId && 'font-semibold text-foreground')}
              >
                <span className="truncate">{p.name}</span>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-[13px]">
              {t('noProjects')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {currentProject && tab && (
        <>
          <Slash />
          {phase ? (
            <Link
              href={`/projects/${currentId}/${tab}`}
              className="whitespace-nowrap text-[13px] text-muted-foreground hover:text-[#F0A56B]"
            >
              {tabLabel(tab)}
            </Link>
          ) : (
            <span className="whitespace-nowrap text-[13px] text-foreground">{tabLabel(tab)}</span>
          )}
        </>
      )}
      {currentProject && phase && (
        <>
          <Slash />
          <span className="whitespace-nowrap text-[13px] text-foreground">{phaseName(phase)}</span>
        </>
      )}

      <div className="flex-1" />

      <UserAvatar user={user} />
    </header>
  )
}
