import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import type { PipelinePhase } from '@/types'

const TRANSLATED_PHASES = new Set([
  'research',
  'ic_selection',
  'architecture_agent',
  'passive_components',
  'component_selection',
  'netlist',
])

/** Translated phase name, falling back to the server name for new phases. */
export function usePhaseName() {
  const t = useTranslations('pipeline')
  return useCallback(
    (phase: Pick<PipelinePhase, 'id' | 'name'>) =>
      TRANSLATED_PHASES.has(phase.id) ? t(phase.id as 'research') : phase.name,
    [t]
  )
}
