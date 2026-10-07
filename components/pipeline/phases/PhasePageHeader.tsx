'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Lock } from 'lucide-react'
import { RunStatusBadge } from '../RunStatusBadge'
import { usePhaseName } from '../usePhaseName'
import type { PhaseState } from '@/hooks/usePipelineState'
import type { PipelinePhase } from '@/types'

interface PhasePageHeaderProps {
  projectId: string
  phase: PipelinePhase
  state: PhaseState | undefined
  previousPhase: PipelinePhase | undefined
}

export function PhasePageHeader({ projectId, phase, state, previousPhase }: PhasePageHeaderProps) {
  const t = useTranslations('pipeline')
  const phaseName = usePhaseName()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{phaseName(phase)}</h1>
        {state?.state === 'running' && <RunStatusBadge status="running" />}
        {state?.state === 'failed' && <RunStatusBadge status="failed" />}
        {state?.activeRunNumber != null && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">
            {t('tile.active', { number: state.activeRunNumber })}
          </span>
        )}
      </div>

      {state?.locked && previousPhase && (
        <PhaseBlockedBanner projectId={projectId} previousPhase={previousPhase} />
      )}
    </div>
  )
}

/** The phase's input comes from a phase that has no active run yet. */
export function PhaseBlockedBanner({
  projectId,
  previousPhase,
}: {
  projectId: string
  previousPhase: PipelinePhase
}) {
  const t = useTranslations('pipeline')
  const phaseName = usePhaseName()

  return (
    <div className="flex items-start gap-3 rounded-md border border-warning/35 bg-warning/[.08] px-3.5 py-3 text-[13px]">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-foreground">{t('blockedTitle')}</span>
        <span className="text-muted-foreground">
          {t.rich('blockedBody', {
            phase: phaseName(previousPhase),
            link: (chunks) => (
              <Link
                href={`/projects/${projectId}/pipeline/${previousPhase.id}`}
                className="text-[#E0894A] hover:text-[#F0A56B] hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </div>
    </div>
  )
}
