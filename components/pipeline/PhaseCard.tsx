'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { RunStatusBadge } from './RunStatusBadge'
import { RunsList } from './RunsList'
import { PhaseInputForm } from './PhaseInputForm'
import { useRunStatus } from '@/hooks/useRunStatus'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/primitives'
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import type { PhaseRun, PipelinePhase, PhaseId } from '@/types'
import type { PhaseFormPayload } from './PhaseInputForm'
import { cn } from '@/lib/utils'

// Icon per phase
import {
  Search,
  Cpu,
  Package,
  FileCode2,
} from 'lucide-react'

const PHASE_ICONS: Record<PhaseId, React.ReactNode> = {
  research: <Search className="h-3.5 w-3.5" />,
  ic_selection: <Cpu className="h-3.5 w-3.5" />,
  component_selection: <Package className="h-3.5 w-3.5" />,
  netlist: <FileCode2 className="h-3.5 w-3.5" />,
}

interface PhaseCardProps {
  phase: PipelinePhase
  projectId: string
  activeRun: PhaseRun | null
  isFirst?: boolean
}

export function PhaseCard({
  phase,
  projectId,
  activeRun,
  isFirst = false,
}: PhaseCardProps) {
  const t = useTranslations('pipeline')
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [activePollingRunId, setActivePollingRunId] = useState<string | null>(null)

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

  const triggerMutation = useMutation({
    mutationFn: ({ inputs, usePerplexity }: PhaseFormPayload) => {
      const payload =
        phase.id === 'research'
          ? { use_perplexity: usePerplexity ?? true, custom_inputs: inputs }
          : { custom_inputs: inputs }
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
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

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
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
            <PhaseInputForm
              phaseId={phase.id}
              defaultInputs={
                (activeRun?.input_payload?.custom_inputs as Record<string, unknown>) ?? {}
              }
              defaultUsePerplexity={
                (activeRun?.input_payload?.use_perplexity as boolean) ?? false
              }
              isLoading={isRunning || triggerMutation.isPending}
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

          {/* Run history */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('runHistory')}
              </p>
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
            </div>
            <RunsList
              projectId={projectId}
              phaseId={phase.id}
              activeRunId={activeRun?.id}
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
