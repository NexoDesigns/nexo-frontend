'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { FileText, GitBranch, Info, Settings2, Shield, type LucideIcon } from 'lucide-react'

export type ProjectTab = 'description' | 'requirements' | 'normatives' | 'pipeline' | 'documents'

export const PROJECT_TABS: { id: ProjectTab; icon: LucideIcon }[] = [
  { id: 'description', icon: Info },
  { id: 'requirements', icon: Settings2 },
  { id: 'normatives', icon: Shield },
  { id: 'pipeline', icon: GitBranch },
  { id: 'documents', icon: FileText },
]

/** Translated label of a project tab (also used by the top-bar breadcrumb). */
export function useProjectTabLabel() {
  const tDescripcion = useTranslations('descripcion')
  const tProjects = useTranslations('projects')
  const tNormativas = useTranslations('normativas')
  const tPipeline = useTranslations('pipeline')
  const tDocuments = useTranslations('documents')
  return (tab: ProjectTab) =>
    ({
      description: tDescripcion('title'),
      requirements: tProjects('requirements'),
      normatives: tNormativas('title'),
      pipeline: tPipeline('title'),
      documents: tDocuments('title'),
    })[tab]
}

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const label = useProjectTabLabel()
  const activeTab = pathname.split('/')[3]

  return (
    <nav className="flex shrink-0 items-center overflow-x-auto border-b border-border px-4">
      {PROJECT_TABS.map(({ id, icon: Icon }) => {
        const active = activeTab === id
        return (
          <Link
            key={id}
            href={`/projects/${projectId}/${id}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-[42px] items-center gap-[7px] whitespace-nowrap px-3.5 text-[13px] outline-none transition-colors focus-visible:text-foreground',
              active
                ? 'font-semibold text-foreground shadow-[inset_0_-2px_0_hsl(var(--primary))]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', active && 'text-[#E0894A]')} />
            {label(id)}
          </Link>
        )
      })}
    </nav>
  )
}
