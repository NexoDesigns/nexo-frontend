'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { runsApi } from '@/lib/api'
import { RunStatusBadge } from './RunStatusBadge'
import { RunOutputViewer } from './RunOutputViewer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives'
import {
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Zap,
  AlertCircle,
  ExternalLink,
  Loader2,
  Pencil,
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

function RunNotesDisplay({
  run,
  projectId,
  phaseId,
}: {
  run: PhaseRun
  projectId: string
  phaseId: string
}) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const notesMutation = useMutation({
    mutationFn: (notes: string) =>
      runsApi.updateNotes(projectId, phaseId, run.id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phaseId] })
      setEditOpen(false)
    },
  })

  const editDialog = (
    <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('editNotes')}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-xs min-h-[80px] resize-none"
          rows={4}
        />
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(false)}
            disabled={notesMutation.isPending}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() => notesMutation.mutate(draft)}
            disabled={notesMutation.isPending}
          >
            {notesMutation.isPending && (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            )}
            {t('saveNotes')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (!run.notes) {
    return (
      <>
        <button
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
          title={t('editNotes')}
          onClick={(e) => {
            e.stopPropagation()
            setDraft('')
            setEditOpen(true)
          }}
        >
          <Pencil className="h-3 w-3" />
        </button>
        {editDialog}
      </>
    )
  }

  const truncated =
    run.notes.length > 20 ? `${run.notes.slice(0, 20)}…` : run.notes

  return (
    <>
      <TooltipPrimitive.Provider delayDuration={200}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <span
              className="text-[10px] text-muted-foreground cursor-default shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {t('notes')}: {truncated}
            </span>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="top"
              sideOffset={6}
              className="z-50 max-w-[260px] rounded-md border border-border bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-foreground">{t('notes')}</span>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title={t('editNotes')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDraft(run.notes ?? '')
                    setEditOpen(true)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              <p className="text-muted-foreground break-words">{run.notes}</p>
              <TooltipPrimitive.Arrow className="fill-border" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
      {editDialog}
    </>
  )
}

export function RunsList({ projectId, phaseId, activeRunId }: RunsListProps) {
  const t = useTranslations('pipeline')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [viewingInputRun, setViewingInputRun] = useState<PhaseRun | null>(null)
  const [viewingOutputRun, setViewingOutputRun] = useState<PhaseRun | null>(null)

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
          const detail = isExpanded ? (expandedRunDetail ?? run) : run
          const hasOutput = !!(expandedRunDetail?.output_payload ?? run.output_payload)

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

                <RunNotesDisplay
                  run={run}
                  projectId={projectId}
                  phaseId={phaseId}
                />

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

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View input */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      disabled={isLoadingThisDetail && !expandedRunDetail}
                      onClick={() => setViewingInputRun(detail)}
                    >
                      {isLoadingThisDetail && !expandedRunDetail && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {t('viewInput')}
                    </Button>

                    {/* View output */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      disabled={isLoadingThisDetail ? !hasOutput : !hasOutput}
                      onClick={() => setViewingOutputRun(detail)}
                    >
                      {isLoadingThisDetail && !hasOutput && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {t('viewOutput')}
                    </Button>

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

      {/* Input modal */}
      <Dialog
        open={!!viewingInputRun}
        onOpenChange={(open) => !open && setViewingInputRun(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t('viewInput')} — {t('runNumber')}{viewingInputRun?.run_number}
            </DialogTitle>
          </DialogHeader>
          {viewingInputRun?.input_payload && (
            <RunOutputViewer output={viewingInputRun.input_payload} />
          )}
        </DialogContent>
      </Dialog>

      {/* Output modal */}
      <Dialog
        open={!!viewingOutputRun}
        onOpenChange={(open) => !open && setViewingOutputRun(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {t('output')} — {t('runNumber')}{viewingOutputRun?.run_number}
            </DialogTitle>
          </DialogHeader>
          {viewingOutputRun?.output_payload && (
            <RunOutputViewer output={viewingOutputRun.output_payload} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
