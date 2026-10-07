'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useProjectPhases } from '@/hooks/useProjectPhases'
import { cn } from '@/lib/utils'

export type StageState = 'done' | 'current' | 'locked'

export interface ProjectStage {
  id: string
  /** Short label under the dot */
  label: string
  /** Full name, shown as tooltip */
  title: string
}

const SHORT_LABEL_IDS = new Set([
  'requirements',
  'research',
  'ic_selection',
  'architecture_agent',
  'passive_components',
  'component_selection',
  'netlist',
])

/** Requirements followed by the server's pipeline phases, in order. */
export function useProjectStages(): ProjectStage[] {
  const t = useTranslations('projects')
  const { phases } = useProjectPhases()

  return useMemo(() => {
    return [
      { id: 'requirements', name: t('requirements') },
      ...phases.map((p) => ({ id: p.id as string, name: p.name })),
    ].map(({ id, name }) => ({
      id,
      title: name,
      label: SHORT_LABEL_IDS.has(id) ? t(`stageShort.${id}`) : name,
    }))
  }, [phases, t])
}

// Per-stage progress is not available from the backend yet, so every stage
// renders as 'locked' (neutral) unless a state is passed in.
const DOT: Record<StageState, string> = {
  done: 'h-2.5 w-2.5 bg-success border-success',
  current: 'h-3.5 w-3.5 bg-background border-primary',
  locked: 'h-2.5 w-2.5 bg-[#2D343D] border-border',
}

export function StageStepper({
  stages,
  states,
}: {
  stages: ProjectStage[]
  states?: Partial<Record<string, StageState>>
}) {
  if (stages.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        {stages.map((stage, i) => {
          const state = states?.[stage.id] ?? 'locked'
          const isLast = i === stages.length - 1
          return (
            <span
              key={stage.id}
              title={stage.title}
              className={cn('flex items-center', isLast ? 'flex-none' : 'flex-1')}
            >
              <span className={cn('shrink-0 rounded-full border-2', DOT[state])} />
              {!isLast && (
                <span className={cn('h-0.5 flex-1', state === 'done' ? 'bg-success' : 'bg-input')} />
              )}
            </span>
          )
        })}
      </div>
      <div className="flex justify-between gap-1">
        {stages.map((stage) => {
          const state = states?.[stage.id] ?? 'locked'
          return (
            <span
              key={stage.id}
              title={stage.title}
              className={cn(
                'truncate text-[10.5px]',
                state === 'current' ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}
            >
              {stage.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Compact segmented bar used in the projects table. */
export function StageProgressBar({
  stages,
  states,
}: {
  stages: ProjectStage[]
  states?: Partial<Record<string, StageState>>
}) {
  return (
    <span
      className="grid flex-1 gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(0, 1fr))` }}
    >
      {stages.map((stage) => {
        const state = states?.[stage.id] ?? 'locked'
        return (
          <span key={stage.id} title={stage.title} className="h-1.5 overflow-hidden rounded-[3px] bg-input">
            {state !== 'locked' && (
              <span
                className={cn('block h-full', state === 'done' ? 'w-full bg-success' : 'w-1/2 bg-primary')}
              />
            )}
          </span>
        )
      })}
    </span>
  )
}
