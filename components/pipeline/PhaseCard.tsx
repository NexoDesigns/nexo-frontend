'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { RunStatusBadge } from './RunStatusBadge'
import { RunsList } from './RunsList'
import { PhaseInputForm } from './PhaseInputForm'
import { ResearchDesignPicker } from './ResearchDesignPicker'
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
} from 'lucide-react'
import type { PipelinePhase, PhaseId, ResearchSolution, ResearchOutputItem } from '@/types'
import type { PhaseFormPayload } from './PhaseInputForm'
import { cn } from '@/lib/utils'

// Icon per phase
import {
  Search,
  Cpu,
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
}

export function PhaseCard({
  phase,
  projectId,
  activeRunId,
  selectedResearchSolutions,
  onSelectedSolutionsChange,
  researchQuerySummary,
  onQuerySummaryChange,
}: PhaseCardProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [designsExpanded, setDesignsExpanded] = useState(true)
  const [activePollingRunId, setActivePollingRunId] = useState<string | null>(null)
  // Independent of any run — persists across card expand/collapse
  const [usePerplexity, setUsePerplexity] = useState(true)

  // Fetch the active (selected output) run details
  const { data: activeRun } = useQuery({
    queryKey: ['run', projectId, phase.id, activeRunId],
    queryFn: () => runsApi.get(projectId, phase.id, activeRunId!),
    enabled: !!activeRunId,
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
    },
    onError: () => {
      setActivePollingRunId(null)
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phase.id] })
    },
  })

  const isRunning =
    pollingRun?.status === 'running' || pollingRun?.status === 'pending'

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

  const triggerMutation = useMutation({
    mutationFn: ({ inputs }: PhaseFormPayload) => {
      const custom_inputs =
        phase.id === 'ic_selection' && selectedResearchSolutions?.length
          ? { ...inputs, selected_solutions: selectedResearchSolutions, query_summary: researchQuerySummary }
          : inputs
      const payload =
        phase.id === 'research'
          ? { use_perplexity: usePerplexity, custom_inputs }
          : { custom_inputs }
      return runsApi.trigger(projectId, phase.id, payload)
    },
    onSuccess: ({ run_id }) => {
      setActivePollingRunId(run_id)
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phase.id] })
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

          {/* Input form */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {t('inputs')}
            </p>
            {phase.id === 'ic_selection' && (
              <div className="mb-3 text-xs">
                {selectedResearchSolutions && selectedResearchSolutions.length > 0 ? (
                  <p className="text-muted-foreground">
                    {t('icSelectionDesigns', { designs: '' }).replace(' ', '\u00A0')}
                    <span className="text-foreground font-medium">
                      {selectedResearchSolutions.map((s) => `${s.id}: ${s.title}`).join(', ')}
                    </span>
                  </p>
                ) : (
                  <p className="text-destructive/80 italic">{t('noDesignsSelected')}</p>
                )}
              </div>
            )}
            <PhaseInputForm
              phaseId={phase.id}
              defaultInputs={
                (activeRun?.input_payload?.custom_inputs as Record<string, unknown>) ?? {}
              }
              usePerplexity={usePerplexity}
              onUsePerplexityChange={setUsePerplexity}
              isLoading={isRunning || triggerMutation.isPending}
              submitDisabled={phase.id === 'ic_selection' && !selectedResearchSolutions?.length}
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
