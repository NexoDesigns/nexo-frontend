'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { formatRelativeDate } from '@/lib/utils'
import { StageStepper, type ProjectStage } from './StageStepper'
import type { Project } from '@/types'

export function ProjectTile({ project, stages }: { project: Project; stages: ProjectStage[] }) {
  const t = useTranslations('projects')
  const locale = useLocale()

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col gap-4 rounded-lg border border-input bg-card p-4 outline-none transition-colors hover:border-primary focus-visible:border-primary"
    >
      <div className="truncate text-base font-semibold text-foreground">{project.name}</div>

      <StageStepper stages={stages} />

      <div className="flex items-center justify-between border-t border-input pt-3 text-xs text-muted-foreground">
        <span>{t('edited', { time: formatRelativeDate(project.updated_at, locale) })}</span>
      </div>
    </Link>
  )
}
