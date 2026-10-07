'use client'

import type { ComponentType } from 'react'
import { useProjectPhases } from '@/hooks/useProjectPhases'
import { usePipelineState } from '@/hooks/usePipelineState'
import { PhasePageHeader } from './PhasePageHeader'
import { PhasePanel } from './PhasePanel'
import { ResearchPhasePage } from './research/ResearchPhasePage'
import type { PhaseId, PipelinePhase, Project } from '@/types'

export interface PhasePageProps {
  project: Project
  phase: PipelinePhase
}

/**
 * Default phase page: header + the shared phase panel. Every phase uses it for
 * now; give a phase its own component below when its dedicated design lands.
 */
export function GenericPhasePage({ project, phase }: PhasePageProps) {
  const { phases, getPrevious } = useProjectPhases(project)
  const { states } = usePipelineState(project.id, phases)

  return (
    <div className="flex flex-col gap-6 px-7 pb-8 pt-6">
      <PhasePageHeader
        projectId={project.id}
        phase={phase}
        state={states[phase.id]}
        previousPhase={getPrevious(phase.id)}
      />
      <PhasePanel phase={phase} project={project} />
    </div>
  )
}

const IcSelectionPhasePage = GenericPhasePage
const ArchitecturePhasePage = GenericPhasePage
const PassiveComponentsPhasePage = GenericPhasePage
const ComponentSelectionPhasePage = GenericPhasePage
const NetlistPhasePage = GenericPhasePage

/** Page component per phase id. Phases not listed fall back to GenericPhasePage. */
export const PHASE_PAGES: Partial<Record<PhaseId, ComponentType<PhasePageProps>>> = {
  research: ResearchPhasePage,
  ic_selection: IcSelectionPhasePage,
  architecture_agent: ArchitecturePhasePage,
  passive_components: PassiveComponentsPhasePage,
  component_selection: ComponentSelectionPhasePage,
  netlist: NetlistPhasePage,
}
