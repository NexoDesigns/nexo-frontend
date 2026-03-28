'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { RunStatusBadge } from './RunStatusBadge'
import { RunOutputViewer } from './RunOutputViewer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives'
import { Separator } from '@/components/ui/primitives'
import {
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Zap,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { n8nExecutionUrl } from '@/lib/constants'
import {
  formatRelativeDate,
  formatDuration,
  formatTokens,
} from '@/lib/utils'
import type { PhaseRun, PhaseId } from '@/types'
import { cn } from '@/lib/utils'
import { useLocale } from 'next-intl'

interface RunsListProps {
  projectId: string
  phaseId: PhaseId
  activeRunId?: string
}

export function RunsList({ projectId, phaseId, activeRunId }: RunsListProps) {
  const t = useTranslations('pipeline')
  const tRuns = useTranslations('runs')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [viewingRun, setViewingRun] = useState<PhaseRun | null>(null)

  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', projectId, phaseId],
    queryFn: () => runsApi.list(projectId, phaseId),
  })

  const { data: expandedRunDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['run', projectId, phaseId, expandedRunId],
    queryFn: () => runsApi.get(projectId, phaseId, expandedRunId!),
    enabled: !!expandedRunId,
  })

  const activateMutation = useMutation({
    mutationFn: (runId: string) => runsApi.activate(projectId, phaseId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phaseId] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        {t('noRuns')}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {runs.map((run) => {
          const isActive = run.id === activeRunId
          const isExpanded = expandedRunId === run.id
          const isLoadingThisDetail = isExpanded && isDetailLoading

          return (
            <div
              key={run.id}
              className={cn(
                'rounded-md border transition-colors',
                isActive
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-card hover:border-border/80'
              )}
            >
              {/* Run header row */}
              <button
                onClick={() =>
                  setExpandedRunId(isExpanded ? null : run.id)
                }
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                  {t('runNumber')}{run.run_number}
                </span>

                <RunStatusBadge status={run.status} />

                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                    <Star className="h-2.5 w-2.5 fill-primary" />
                    {t('activeRun')}
                  </span>
                )}

                <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                  {run.duration_seconds !== null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(run.duration_seconds)}
                    </span>
                  )}
                  {run.llm_tokens_used !== null && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {formatTokens(run.llm_tokens_used)}
                    </span>
                  )}
                  <span>{formatRelativeDate(run.created_at, locale)}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-3 py-3 space-y-3 animate-fade-in">
                  {/* Error message */}
                  {run.status === 'failed' && run.error_message && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="font-mono">{run.error_message}</span>
                    </div>
                  )}

                  {/* Output viewer + Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {run.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        disabled={isLoadingThisDetail || !expandedRunDetail?.output_payload}
                        onClick={() => expandedRunDetail && setViewingRun(expandedRunDetail)}
                      >
                        {isLoadingThisDetail && <Loader2 className="h-3 w-3 animate-spin" />}
                        {t('viewOutput')}
                      </Button>
                    )}
                    {run.status === 'completed' && !isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        onClick={() => activateMutation.mutate(run.id)}
                        disabled={activateMutation.isPending}
                      >
                        <Star className="h-3 w-3" />
                        {t('activateRun')}
                      </Button>
                    )}
                    {(() => {
                      const execId = expandedRunDetail?.n8n_execution_id ?? run.n8n_execution_id
                      const url = n8nExecutionUrl(phaseId, execId)
                      if (!url) return null
                      return (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs gap-1.5 text-muted-foreground"
                          asChild
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                            {t('viewInN8n')}
                          </a>
                        </Button>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Output modal */}
      <Dialog
        open={!!viewingRun}
        onOpenChange={(open) => !open && setViewingRun(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('output')} — {t('runNumber')}{viewingRun?.run_number}
            </DialogTitle>
          </DialogHeader>
          {viewingRun?.output_payload && (
            <RunOutputViewer output={viewingRun.output_payload} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
