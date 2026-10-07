'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { useProjectPhases } from '@/hooks/useProjectPhases'
import { usePipelineState, type PhaseState } from '@/hooks/usePipelineState'
import { usePhaseName } from './usePhaseName'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PipelinePhase, Project } from '@/types'

// ─── Tile icons (from design 3a) ──────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#5FBE6D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <polyline points="5.5,9.3 8,11.8 12.5,6.6" />
    </svg>
  )
}

function CurrentIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FFE3B8" strokeWidth="1.6" className={cn(spinning && 'animate-pulse')} aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <circle cx="9" cy="9" r="2.6" fill="#FFE3B8" stroke="none" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#8D99AC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="12" height="9" rx="1.5" />
      <path d="M6 8V5.5a3 3 0 0 1 6 0V8" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#FF7A5C" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 5.5v4M9 12.3h.01" />
    </svg>
  )
}

function IdleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#8D99AC" strokeWidth="1.6" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
    </svg>
  )
}

function Arrow({ solid }: { solid: boolean }) {
  return (
    <svg width="32" height="10" viewBox="0 0 32 10" className="shrink-0" aria-hidden="true">
      <line
        x1="0" y1="5" x2="25" y2="5"
        stroke={solid ? '#E7ECF3' : '#8D99AC'}
        strokeWidth="1.5"
        strokeDasharray={solid ? undefined : '4 4'}
        opacity={solid ? 1 : 0.75}
      />
      <path d="M24 1.2L31 5L24 8.8Z" fill={solid ? '#E7ECF3' : '#8D99AC'} />
    </svg>
  )
}

// ─── Tile ─────────────────────────────────────────────────────────────────────

type TileVariant = 'done' | 'current' | 'locked' | 'idle'

function tileVariant(s: PhaseState | undefined): TileVariant {
  if (!s) return 'idle'
  if (s.state === 'done') return 'done'
  if (s.locked) return 'locked'
  if (s.isCurrent || s.state === 'running') return 'current'
  return 'idle'
}

const TILE_STYLE: Record<TileVariant, string> = {
  done: 'border-2 border-[#5FBE6D] bg-card hover:border-[#D3A06C]',
  current: 'border-2 border-[#8F450D] bg-primary text-white hover:border-white',
  locked: 'border-[1.5px] border-dashed border-input bg-background text-muted-foreground hover:border-border',
  idle: 'border-2 border-input bg-card hover:border-[#D3A06C]',
}

function PhaseTile({
  projectId,
  phase,
  index,
  state,
  previousPhase,
}: {
  projectId: string
  phase: PipelinePhase
  index: number
  state: PhaseState | undefined
  previousPhase: PipelinePhase | undefined
}) {
  const t = useTranslations('pipeline')
  const phaseName = usePhaseName()
  const variant = tileVariant(state)
  const name = phaseName(phase)
  const running = state?.state === 'running'

  const statusText = !state
    ? ''
    : state.state === 'done'
    ? t('tile.active', { number: state.activeRunNumber ?? '–' })
    : running
    ? t('tile.running')
    : state.locked && previousPhase
    ? t('tile.locked', { phase: phaseName(previousPhase) })
    : state.state === 'failed'
    ? t('tile.failed')
    : t('tile.notStarted')

  return (
    <Link
      href={`/projects/${projectId}/pipeline/${phase.id}`}
      title={`${String(index + 1).padStart(2, '0')} · ${name}`}
      className={cn(
        'box-border flex aspect-square min-w-[128px] flex-1 flex-col rounded-md p-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        TILE_STYLE[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn('text-[11px] font-semibold', variant === 'current' ? 'text-white/70' : 'text-muted-foreground')}>
          {String(index + 1).padStart(2, '0')}
        </span>
        {variant === 'done' ? (
          <CheckIcon />
        ) : variant === 'current' ? (
          <CurrentIcon spinning={running} />
        ) : variant === 'locked' ? (
          <LockIcon />
        ) : state?.state === 'failed' ? (
          <AlertIcon />
        ) : (
          <IdleIcon />
        )}
      </div>
      <div
        className={cn(
          'mt-3.5 text-[15px] font-semibold leading-tight',
          variant === 'current' ? 'text-white' : variant === 'locked' ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {name}
      </div>
      <div className="flex-1" />
      <div
        className={cn(
          'mb-2 truncate text-xs font-semibold',
          variant === 'current'
            ? 'text-white'
            : state?.state === 'failed' && !state.locked
            ? 'text-destructive'
            : variant === 'done'
            ? 'text-foreground'
            : 'text-muted-foreground'
        )}
      >
        {statusText}
      </div>
      <div className={cn('h-1 overflow-hidden rounded-sm', variant === 'current' ? 'bg-white/25' : 'bg-input')}>
        <div
          className={cn(
            'h-full',
            variant === 'done' && 'w-full bg-success',
            running && 'w-1/2 animate-pulse bg-[#FFE3B8]'
          )}
        />
      </div>
    </Link>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export function PipelineOverview({ project }: { project: Project }) {
  const { phases, isLoading: phasesLoading, getPrevious } = useProjectPhases(project)
  const { states, isLoading: stateLoading } = usePipelineState(project.id, phases)

  if (phasesLoading || stateLoading) {
    return (
      <div className="flex gap-[38px] px-8 pb-10 pt-7">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-square min-w-[128px] flex-1 rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto px-8 pb-10 pt-7">
      <div className="flex items-center gap-1.5">
        {phases.map((phase, idx) => (
          <Fragment key={phase.id}>
            {idx > 0 && <Arrow solid={states[phases[idx - 1].id]?.state === 'done'} />}
            <PhaseTile
              projectId={project.id}
              phase={phase}
              index={idx}
              state={states[phase.id]}
              previousPhase={getPrevious(phase.id)}
            />
          </Fragment>
        ))}
      </div>
    </div>
  )
}
