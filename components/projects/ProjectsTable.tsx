'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { formatRelativeDate } from '@/lib/utils'
import { StageProgressBar, type ProjectStage } from './StageStepper'
import type { Project, ProjectStatus } from '@/types'

const GRID = 'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)_minmax(0,2.4fr)_130px_110px] gap-4'

const STATUS_COLOR: Record<ProjectStatus, string> = {
  active: 'text-[#E0894A]',
  completed: 'text-success',
  archived: 'text-muted-foreground',
}

export function ProjectsTable({ projects, stages }: { projects: Project[]; stages: ProjectStage[] }) {
  const t = useTranslations('projects')
  const tStatus = useTranslations('status')
  const locale = useLocale()

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card">
      <div
        className={`${GRID} border-b border-input bg-[#1D232A] px-4 py-2.5 text-[11px] uppercase tracking-[.06em] text-muted-foreground`}
      >
        <span>{t('colProject')}</span>
        <span>{t('colCurrentStage')}</span>
        <span>{t('colStageProgress')}</span>
        <span>{t('colStatus')}</span>
        <span>{t('colEdited')}</span>
      </div>
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className={`${GRID} items-center border-b border-[#2D343D] px-4 py-3 text-[13px] outline-none transition-colors last:border-b-0 hover:bg-[#252C35] focus-visible:bg-[#252C35]`}
        >
          <span className="truncate font-semibold text-foreground">{project.name}</span>
          {/* Current stage isn't exposed by the backend yet */}
          <span className="text-muted-foreground">—</span>
          <span className="flex items-center gap-2.5">
            <StageProgressBar stages={stages} />
          </span>
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap text-xs ${STATUS_COLOR[project.status]}`}
          >
            <span className="h-[7px] w-[7px] rounded-full bg-current" />
            {tStatus(project.status)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(project.updated_at, locale)}
          </span>
        </Link>
      ))}
    </div>
  )
}
