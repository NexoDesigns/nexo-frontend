'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { useCustomOutputs } from '@/hooks/useCustomOutputs'
import { useRunStatus } from '@/hooks/useRunStatus'
import { useActiveRuns, usePhaseRuns } from '@/hooks/usePipelineState'
import { useResearchSelection } from '@/hooks/usePhaseSelections'
import { RunStatusBadge } from '../RunStatusBadge'
import { RunsList } from '../RunsList'
import { PhaseInputForm } from '../PhaseInputForm'
import { IcSelectionOutputViewer } from '../IcSelectionOutputViewer'
import { ComponentSelectionOutputViewer } from '../ComponentSelectionOutputViewer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/primitives'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import type { PipelinePhase, Project } from '@/types'
import type { PhaseFormPayload } from '../PhaseInputForm'

interface PhasePanelProps {
  phase: PipelinePhase
  project: Project
}

/**
 * Inputs, output and run history of one pipeline phase — the content of the
 * former collapsible PhaseCard, always open. Shared by the phase pages that
 * don't have their own design yet (Research and Architecture have their own pages).
 */
export function PhasePanel({ phase, project }: PhasePanelProps) {
  const projectId = project.id
  const t = useTranslations('pipeline')
  const queryClient = useQueryClient()
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [activePollingRunId, setActivePollingRunId] = useState<string | null>(null)

  const { data: activeRuns } = useActiveRuns(projectId)
  const activeRunId = activeRuns?.find((a) => a.phase_id === phase.id)?.run_id ?? null

  // Saved selections that link this phase to its neighbours
  const research = useResearchSelection(projectId)

  // Custom output items for this phase's active run
  const customOutputs = useCustomOutputs(projectId, phase.id, activeRunId)

  // Active (selected output) run details. For component_selection, refetch on
  // focus — bom_result is populated by actions outside this tab.
  const { data: activeRun, refetch: refetchActiveRun } = useQuery({
    queryKey: ['run', projectId, phase.id, activeRunId],
    queryFn: () => runsApi.get(projectId, phase.id, activeRunId!),
    enabled: !!activeRunId,
    refetchOnWindowFocus: phase.id === 'component_selection',
  })

  // Polling for a run started from this page
  const { run: pollingRun } = useRunStatus({
    projectId,
    phaseId: phase.id,
    runId: activePollingRunId,
    onComplete: () => {
      setActivePollingRunId(null)
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phase.id] })
      queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
      // Refresh any open run detail (fixes stale output_payload after run completes)
      queryClient.invalidateQueries({ queryKey: ['run', projectId, phase.id] })
    },
    onError: () => {
      setActivePollingRunId(null)
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phase.id] })
    },
  })

  // Runs started elsewhere (another page, another user) also block a duplicate launch
  const { data: phaseRuns } = usePhaseRuns(projectId, phase.id)
  const hasRunInFlight = phaseRuns?.some((r) => r.status === 'pending' || r.status === 'running')

  const isRunning =
    pollingRun?.status === 'running' || pollingRun?.status === 'pending' || !!hasRunInFlight

  // bom_result is populated asynchronously
  useEffect(() => {
    if (phase.id === 'component_selection' && activeRunId) {
      refetchActiveRun()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.id, activeRunId])

  // ─── Duplicate handlers ───────────────────────────────────────────────────

  const handleDuplicateIcResult = (result: Record<string, unknown>) => {
    const originalId = String(result.id ?? '')
    const existingIds = new Set(
      customOutputs.items
        .filter((ci) => ci.source_item_id === originalId)
        .map((ci) => (ci.data as { id?: string }).id ?? '')
    )
    let suffix = 1
    while (existingIds.has(`${originalId}_${suffix}`)) suffix++
    const newId = `${originalId}_${suffix}`
    customOutputs.addItem.mutate({
      source_item_id: originalId,
      source_item_label: newId.slice(0, 50),
      data: { ...result, id: newId },
    })
  }

  const handleDuplicateComponent = (component: Record<string, unknown>) => {
    const originalRef = String(component.ref ?? '')
    const existingRefs = new Set(
      customOutputs.items
        .filter((ci) => ci.source_item_id === originalRef)
        .map((ci) => (ci.data as { ref?: string }).ref ?? '')
    )
    let suffix = 1
    while (existingRefs.has(`${originalRef}_${suffix}`)) suffix++
    const newRef = `${originalRef}_${suffix}`
    customOutputs.addItem.mutate({
      source_item_id: originalRef,
      source_item_label: newRef.slice(0, 50),
      data: { ...component, ref: newRef },
    })
  }

  const handleUpdateCustom = async (itemId: string, data: Record<string, unknown>) => {
    await customOutputs.updateItem.mutateAsync({ itemId, data })
  }

  const recheckBomMutation = useMutation({
    mutationFn: () => runsApi.recheckBom(projectId, phase.id, activeRun!.id),
    onSuccess: () => {
      // BOM runs in background; re-fetch the run after a short delay to pick up the result
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['run', projectId, phase.id, activeRunId] })
      }, 8000)
    },
  })

  const triggerMutation = useMutation({
    mutationFn: ({ inputs }: PhaseFormPayload) => {
      let custom_inputs: Record<string, unknown> = inputs as Record<string, unknown>

      if (phase.id === 'ic_selection' && research.selectedSolutions.length) {
        custom_inputs = {
          ...inputs,
          selected_solutions: research.selectedSolutions,
          query_summary: research.querySummary,
        }
      }

      return runsApi.trigger(projectId, phase.id, { custom_inputs })
    },
    onSuccess: ({ run_id }, { notes }) => {
      setActivePollingRunId(run_id)
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phase.id] })
      if (notes) {
        runsApi.updateNotes(projectId, phase.id, run_id, notes).then(() => {
          queryClient.invalidateQueries({ queryKey: ['runs', projectId, phase.id] })
        })
      }
    },
  })

  return (
    <div className="space-y-4 rounded-lg border border-input bg-card p-6 animate-fade-in">
      {/* Input form */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {t('inputs')}
        </p>
        {phase.id === 'ic_selection' && (
          <div className="mb-3 text-xs">
            {research.selectedSolutions.length > 0 ? (
              <p className="text-muted-foreground">
                {t('icSelectionDesigns')}{' '}
                <span className="text-foreground font-medium">
                  {research.selectedSolutions.map((s) => `${s.id}: ${s.title}`).join(', ')}
                </span>
              </p>
            ) : (
              <p className="text-destructive/80 italic">{t('noDesignsSelected')}</p>
            )}
          </div>
        )}
        {phase.id === 'component_selection' && (
          <p className="mb-3 text-xs text-muted-foreground italic">
            {t('componentSelectionDisabled')}
          </p>
        )}
        <PhaseInputForm
          phaseId={phase.id}
          defaultInputs={
            (activeRun?.input_payload?.custom_inputs as Record<string, unknown>) ?? {}
          }
          isLoading={isRunning || triggerMutation.isPending}
          submitDisabled={
            (phase.id === 'ic_selection' && !research.selectedSolutions.length) ||
            phase.id === 'component_selection'
          }
          onSubmit={(payload) => triggerMutation.mutate(payload)}
        />
      </div>

      {triggerMutation.isError && (
        <p className="text-xs text-destructive">
          {triggerMutation.error instanceof Error
            ? triggerMutation.error.message
            : t('launchError')}
        </p>
      )}

      <Separator />

      {/* IC Selection output */}
      {phase.id === 'ic_selection' && activeRun?.output_payload && (
        <>
          <IcSelectionOutputViewer
            output={activeRun.output_payload}
            customItems={customOutputs.items}
            onDuplicate={(result) => handleDuplicateIcResult(result as unknown as Record<string, unknown>)}
            onUpdateCustom={handleUpdateCustom}
            onDeleteCustom={(id) => customOutputs.deleteItem.mutate(id)}
          />
          <Separator />
        </>
      )}

      {/* Component Selection output */}
      {phase.id === 'component_selection' && activeRun?.output_payload && (
        <>
          <ComponentSelectionOutputViewer
            output={activeRun.output_payload}
            bomResult={activeRun.bom_result}
            isRecheckPending={recheckBomMutation.isPending}
            onRecheck={() => recheckBomMutation.mutate()}
            customItems={customOutputs.items}
            onDuplicate={(comp) => handleDuplicateComponent(comp as unknown as Record<string, unknown>)}
            onUpdateCustom={handleUpdateCustom}
            onDeleteCustom={(id) => customOutputs.deleteItem.mutate(id)}
          />
          <Separator />
        </>
      )}

      {/* Run history */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setHistoryExpanded((v) => !v)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {t('runHistory')}
            </p>
            {activeRun?.run_number && (
              <span className="text-[10px] text-primary font-medium">
                {t('runSelected', { number: activeRun.run_number })}
              </span>
            )}
            {historyExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          {historyExpanded && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['runs', projectId, phase.id],
                })
              }
              title={t('refresh')}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
        {historyExpanded && (
          <div className="max-h-[280px] overflow-y-auto animate-fade-in">
            <RunsList
              projectId={projectId}
              phaseId={phase.id}
              activeRunId={activeRun?.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
