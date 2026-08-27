'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { useCustomOutputs } from '@/hooks/useCustomOutputs'
import { RunStatusBadge } from './RunStatusBadge'
import { RunsList } from './RunsList'
import { PhaseInputForm } from './PhaseInputForm'
import { ResearchDesignPicker } from './ResearchDesignPicker'
import { IcSelectionOutputViewer } from './IcSelectionOutputViewer'
import { IcDesignPicker } from './IcDesignPicker'
import { ArchitectureDiagramModal } from './ArchitectureDiagramModal'
import { ComponentSelectionOutputViewer } from './ComponentSelectionOutputViewer'
import { useRunStatus } from '@/hooks/useRunStatus'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import type { PipelinePhase, PhaseId, RequirementsRun, ResearchSolution, ResearchOutputItem } from '@/types'
import type { PhaseFormPayload } from './PhaseInputForm'
import { cn } from '@/lib/utils'

// Icon per phase
import {
  Search,
  Cpu,
  Workflow,
  Boxes,
  Package,
  FileCode2,
} from 'lucide-react'

function isResearchOutputItem(value: unknown): value is ResearchOutputItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'solutions' in value &&
    Array.isArray((value as Record<string, unknown>).solutions)
  )
}

const PHASE_ICONS: Record<PhaseId, React.ReactNode> = {
  research: <Search className="h-3.5 w-3.5" />,
  ic_selection: <Cpu className="h-3.5 w-3.5" />,
  architecture_agent: <Workflow className="h-3.5 w-3.5" />,
  passive_components: <Boxes className="h-3.5 w-3.5" />,
  component_selection: <Package className="h-3.5 w-3.5" />,
  netlist: <FileCode2 className="h-3.5 w-3.5" />,
}

interface PhaseCardProps {
  phase: PipelinePhase
  projectId: string
  activeRunId: string | null
  selectedResearchSolutions?: ResearchSolution[]
  onSelectedSolutionsChange?: (solutions: ResearchSolution[]) => void
  researchQuerySummary?: string
  onQuerySummaryChange?: (summary: string) => void
  /** Active run ID for ic_selection — needed by architecture_agent to show the design picker */
  icSelectionActiveRunId?: string | null
  /** Active requirements run — shown as read-only context in the research phase */
  activeRequirementsRun?: RequirementsRun | null
}

export function PhaseCard({
  phase,
  projectId,
  activeRunId,
  selectedResearchSolutions,
  onSelectedSolutionsChange,
  researchQuerySummary,
  onQuerySummaryChange,
  icSelectionActiveRunId,
  activeRequirementsRun,
}: PhaseCardProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const tReq = useTranslations('requirements')
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [designsExpanded, setDesignsExpanded] = useState(true)
  const [activePollingRunId, setActivePollingRunId] = useState<string | null>(null)
  // Independent of any run — persists across card expand/collapse
  const [usePerplexity, setUsePerplexity] = useState(true)

  // architecture_agent: which ic_selection design (e.g. "A") the user has chosen
  const [selectedIcDesignId, setSelectedIcDesignId] = useState<string | null>(null)
  const [diagramModalOpen, setDiagramModalOpen] = useState(false)

  // Custom output items for this phase's active run
  const customOutputs = useCustomOutputs(projectId, phase.id, activeRunId)

  // Fetch the active (selected output) run details
  // For component_selection/architecture_agent, refetch on focus — bom_result and
  // the diagram-editor approval are both populated by actions outside this tab.
  const { data: activeRun, refetch: refetchActiveRun } = useQuery({
    queryKey: ['run', projectId, phase.id, activeRunId],
    queryFn: () => runsApi.get(projectId, phase.id, activeRunId!),
    enabled: !!activeRunId,
    refetchOnWindowFocus: phase.id === 'component_selection' || phase.id === 'architecture_agent',
  })

  // Fetch ic_selection active run output (only needed for architecture_agent phase)
  const { data: icSelectionRun } = useQuery({
    queryKey: ['run', projectId, 'ic_selection', icSelectionActiveRunId],
    queryFn: () => runsApi.get(projectId, 'ic_selection', icSelectionActiveRunId!),
    enabled: phase.id === 'architecture_agent' && !!icSelectionActiveRunId,
  })

  // Polling for in-flight run
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

  const isRunning =
    pollingRun?.status === 'running' || pollingRun?.status === 'pending'

  // Refetch active run when component_selection/architecture_agent cards expand —
  // bom_result and the diagram-editor approval are both populated asynchronously
  useEffect(() => {
    if ((phase.id === 'component_selection' || phase.id === 'architecture_agent') && expanded && activeRunId) {
      refetchActiveRun()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, phase.id, activeRunId])

  // Auto-select all solutions when research active run changes
  useEffect(() => {
    if (phase.id !== 'research' || !activeRun?.output_payload) return
    const raw = activeRun.output_payload as unknown
    let items: ResearchOutputItem[] = []
    if (isResearchOutputItem(raw)) {
      items = [raw]
    } else if (Array.isArray(raw)) {
      items = raw.filter(isResearchOutputItem)
    }
    const allSolutions = items.flatMap((item) => item.solutions)
    if (allSolutions.length > 0 && onSelectedSolutionsChange) {
      onSelectedSolutionsChange(allSolutions)
    }
    const summary = items[0]?.query_summary
    if (summary && onQuerySummaryChange) {
      onQuerySummaryChange(summary)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun?.id, phase.id])

  // ─── Duplicate handlers ───────────────────────────────────────────────────

  const handleDuplicateResearch = (solution: ResearchSolution) => {
    // Build newId as "{original_id}_1", "_2", etc., skipping any already in use
    const existingIds = new Set(
      customOutputs.items
        .filter((ci) => ci.source_item_id === solution.id)
        .map((ci) => (ci.data as { id?: string }).id ?? '')
    )
    let suffix = 1
    while (existingIds.has(`${solution.id}_${suffix}`)) suffix++
    const newId = `${solution.id}_${suffix}`

    const newData = { ...solution, id: newId }
    customOutputs.addItem.mutate(
      {
        source_item_id: solution.id,
        source_item_label: newId.slice(0, 50),
        data: newData as unknown as Record<string, unknown>,
      },
      {
        onSuccess: () => {
          if (onSelectedSolutionsChange) {
            onSelectedSolutionsChange([...(selectedResearchSolutions ?? []), newData])
          }
        },
      }
    )
  }

  const handleDeleteCustomResearch = (itemId: string) => {
    const item = customOutputs.items.find((ci) => ci.id === itemId)
    if (item && onSelectedSolutionsChange) {
      const solutionId = (item.data as { id: string }).id
      onSelectedSolutionsChange((selectedResearchSolutions ?? []).filter((s) => s.id !== solutionId))
    }
    customOutputs.deleteItem.mutate(itemId)
  }

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

  // Mints a fresh editor-link and opens it in a new tab — self-sufficient (token
  // carries project/run scope), so it works even if this tab is later closed.
  const openInNewTabMutation = useMutation({
    mutationFn: () => runsApi.getEditorLink(projectId, 'architecture_agent', activeRun!.id),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener')
    },
  })

  const triggerMutation = useMutation({
    mutationFn: ({ inputs }: PhaseFormPayload) => {
      let custom_inputs: Record<string, unknown> = inputs as Record<string, unknown>

      if (phase.id === 'ic_selection' && selectedResearchSolutions?.length) {
        custom_inputs = {
          ...inputs,
          selected_solutions: selectedResearchSolutions,
          query_summary: researchQuerySummary,
        }
      } else if (phase.id === 'architecture_agent' && selectedIcDesignId) {
        custom_inputs = {
          ...inputs,
          selected_design_id: selectedIcDesignId,
        }
      }

      const payload =
        phase.id === 'research'
          ? {
              use_perplexity: usePerplexity,
              custom_inputs: {
                ...custom_inputs,
                requirements_drive_url: activeRequirementsRun?.output_drive_url ?? null,
              },
            }
          : { custom_inputs }
      return runsApi.trigger(projectId, phase.id, payload)
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

  // Determine card status indicator
  const cardStatus = isRunning
    ? 'running'
    : activeRun?.status === 'completed'
    ? 'completed'
    : activeRun?.status === 'failed'
    ? 'failed'
    : 'idle'

  return (
    <Card
      className={cn(
        'transition-colors',
        cardStatus === 'running' && 'border-warning/40',
        cardStatus === 'completed' && 'border-success/30',
        cardStatus === 'failed' && 'border-destructive/30'
      )}
    >
      {/* Phase header */}
      <CardHeader className="pb-3 p-0">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Phase number + icon */}
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                cardStatus === 'completed'
                  ? 'bg-success/15 text-success'
                  : cardStatus === 'running'
                  ? 'bg-warning/15 text-warning'
                  : cardStatus === 'failed'
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {cardStatus === 'completed' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                PHASE_ICONS[phase.id]
              )}
            </div>

            <div className="min-w-0">
              <CardTitle className="text-sm">
                {t(phase.id as keyof ReturnType<typeof t>)}
              </CardTitle>
              {activeRun && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Run #{activeRun.run_number} activa
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isRunning && <RunStatusBadge status="running" />}
            {!isRunning && activeRun && (
              <RunStatusBadge status={activeRun.status} />
            )}
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {/* Expanded panel */}
      {expanded && (
        <CardContent className="pt-0 space-y-4 animate-fade-in">
          <Separator />

          {/* Requirements run context — research phase only */}
          {phase.id === 'research' && (
            <>
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {tReq('requirementsRun')}
                </p>
                {activeRequirementsRun ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs min-w-0">
                      <span className="font-mono text-muted-foreground shrink-0">
                        {t('runNumber')}{activeRequirementsRun.run_number}
                      </span>
                      <RunStatusBadge status={activeRequirementsRun.status} />
                    </div>
                    {activeRequirementsRun.output_drive_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs gap-1 text-muted-foreground shrink-0"
                        asChild
                      >
                        <a
                          href={activeRequirementsRun.output_drive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {tReq('viewInDrive')}
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {tReq('noRequirementsRun')}
                  </p>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Input form */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t('inputs')}
            </p>
            {phase.id === 'ic_selection' && (
              <div className="mb-3 text-xs">
                {selectedResearchSolutions && selectedResearchSolutions.length > 0 ? (
                  <p className="text-muted-foreground">
                    {t('icSelectionDesigns')}{' '}
                    <span className="text-foreground font-medium">
                      {selectedResearchSolutions.map((s) => `${s.id}: ${s.title}`).join(', ')}
                    </span>
                  </p>
                ) : (
                  <p className="text-destructive/80 italic">{t('noDesignsSelected')}</p>
                )}
              </div>
            )}
            {phase.id === 'architecture_agent' && (
              <div className="mb-3">
                <IcDesignPicker
                  icSelectionOutput={icSelectionRun?.output_payload as Record<string, unknown> | null}
                  selectedDesignId={selectedIcDesignId}
                  onSelect={setSelectedIcDesignId}
                />
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
              usePerplexity={usePerplexity}
              onUsePerplexityChange={setUsePerplexity}
              isLoading={isRunning || triggerMutation.isPending}
              submitDisabled={
                (phase.id === 'ic_selection' && !selectedResearchSolutions?.length) ||
                (phase.id === 'architecture_agent' && !selectedIcDesignId) ||
                phase.id === 'component_selection'
              }
              onSubmit={(payload) => triggerMutation.mutate(payload)}
            />
          </div>

          {triggerMutation.isError && (
            <p className="text-xs text-destructive">
              {triggerMutation.error instanceof Error
                ? triggerMutation.error.message
                : 'Error al lanzar la ejecución'}
            </p>
          )}

          <Separator />

          {/* Selected designs — research phase only */}
          {phase.id === 'research' && (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => setDesignsExpanded((v) => !v)}
                  className="flex items-center gap-2 cursor-pointer mb-2"
                >
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {t('selectedDesigns')}
                  </p>
                  {!designsExpanded && (selectedResearchSolutions ?? []).length > 0 && (
                    <span className="text-[10px] text-primary font-medium">
                      {(selectedResearchSolutions ?? []).map((s) => s.id).join(', ')} {tCommon('selected')}
                    </span>
                  )}
                  {designsExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                {designsExpanded && (
                  <div className="animate-fade-in">
                    {!activeRunId ? (
                      <p className="text-xs text-muted-foreground italic">
                        {t('selectRunFirst')}
                      </p>
                    ) : !activeRun ? (
                      <div className="flex gap-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-32 flex-1 min-w-[180px]" />
                        ))}
                      </div>
                    ) : (
                      <>
                        {activeRun.output_payload ? (
                          <ResearchDesignPicker
                            output={activeRun.output_payload}
                            selectedSolutions={selectedResearchSolutions ?? []}
                            onToggle={(solution) => {
                              if (!onSelectedSolutionsChange) return
                              const current = selectedResearchSolutions ?? []
                              const isSelected = current.some((s) => s.id === solution.id)
                              if (isSelected) {
                                if (current.length > 1) {
                                  onSelectedSolutionsChange(current.filter((s) => s.id !== solution.id))
                                }
                              } else {
                                onSelectedSolutionsChange([...current, solution])
                              }
                            }}
                            customItems={customOutputs.items}
                            onDuplicate={handleDuplicateResearch}
                            onUpdateCustom={handleUpdateCustom}
                            onDeleteCustom={handleDeleteCustomResearch}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {t('noDesignsInOutput')}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

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

          {/* Architecture Agent output — opens the System Diagram App instead of an inline viewer */}
          {phase.id === 'architecture_agent' && activeRun?.status === 'completed' && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setDiagramModalOpen(true)} className="gap-1.5">
                  {t('openDiagramEditor')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={openInNewTabMutation.isPending}
                  onClick={() => openInNewTabMutation.mutate()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('openDiagramEditorNewTab')}
                </Button>
              </div>
              {openInNewTabMutation.isError && (
                <p className="text-xs text-destructive mt-1.5">
                  {openInNewTabMutation.error instanceof Error
                    ? openInNewTabMutation.error.message
                    : 'Error'}
                </p>
              )}
              <ArchitectureDiagramModal
                projectId={projectId}
                runId={activeRun.id}
                open={diagramModalOpen}
                onOpenChange={setDiagramModalOpen}
                onApproved={() => {
                  queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
                  refetchActiveRun()
                }}
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
                  title="Actualizar"
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
        </CardContent>
      )}
    </Card>
  )
}
