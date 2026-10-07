'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import { profilesApi, runsApi } from '@/lib/api'
import { usePhaseRuns } from '@/hooks/usePipelineState'
import { SidePanel } from '@/components/layout/SidePanel'
import { RunHistoryCard } from './RunHistoryCard'
import { RunOutputViewer } from './RunOutputViewer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives'
import type { PhaseId, PhaseRun } from '@/types'

interface RunHistoryPanelProps {
  projectId: string
  phaseId: PhaseId
  activeRunId: string | null
  selectedRunId: string | null
  onSelect: (runId: string) => void
  /**
   * The page's "Select run" action (e.g. Research: activate + save its
   * selection). Without it, the button only makes the run active.
   */
  onConfirmRun?: (runId: string) => void
  isConfirming?: boolean
}

/** A phase's runs in the docked right panel: select one to view it, expand for details. */
export function RunHistoryPanel({
  projectId,
  phaseId,
  activeRunId,
  selectedRunId,
  onSelect,
  onConfirmRun,
  isConfirming = false,
}: RunHistoryPanelProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [viewing, setViewing] = useState<{ run: PhaseRun; what: 'input' | 'output' } | null>(null)
  const [notesRun, setNotesRun] = useState<PhaseRun | null>(null)
  const [notesDraft, setNotesDraft] = useState('')

  const { data: runs, isLoading } = usePhaseRuns(projectId, phaseId)
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list(),
    staleTime: 5 * 60 * 1000,
  })
  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? [])

  // The list endpoint may omit payloads: fetch the full run for the input/output dialogs
  const { data: viewingDetail } = useQuery({
    queryKey: ['run', projectId, phaseId, viewing?.run.id],
    queryFn: () => runsApi.get(projectId, phaseId, viewing!.run.id),
    enabled: !!viewing,
  })
  const viewedRun = viewingDetail ?? viewing?.run
  const viewedPayload = viewing?.what === 'input' ? viewedRun?.input_payload : viewedRun?.output_payload

  const activateMutation = useMutation({
    mutationFn: (runId: string) => runsApi.activate(projectId, phaseId, runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phaseId] })
    },
  })

  const notesMutation = useMutation({
    mutationFn: ({ runId, notes }: { runId: string; notes: string }) =>
      runsApi.updateNotes(projectId, phaseId, runId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, phaseId] })
      setNotesRun(null)
    },
  })

  const toggleExpanded = (runId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(runId)) next.delete(runId)
      else next.add(runId)
      return next
    })

  const sortedRuns = [...(runs ?? [])].sort((a, b) => b.run_number - a.run_number)

  return (
    <>
      <SidePanel
        storageKey="run-history"
        title={t('runHistory')}
        headerActions={
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['runs', projectId, phaseId] })}
            title={t('refresh')}
            aria-label={t('refresh')}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="flex flex-col gap-2.5 pt-1">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-full rounded-md" />)
          ) : sortedRuns.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t('noRuns')}</p>
          ) : (
            sortedRuns.map((run) => (
              <RunHistoryCard
                key={run.id}
                run={run}
                authorName={profileMap.get(run.created_by)}
                isActive={run.id === activeRunId}
                isSelected={run.id === selectedRunId}
                isExpanded={expanded.has(run.id)}
                onSelect={() => onSelect(run.id)}
                onToggleExpand={() => toggleExpanded(run.id)}
                onViewInput={() => setViewing({ run, what: 'input' })}
                onViewOutput={() => setViewing({ run, what: 'output' })}
                onConfirm={() =>
                  onConfirmRun ? onConfirmRun(run.id) : activateMutation.mutate(run.id)
                }
                isConfirming={onConfirmRun ? isConfirming : activateMutation.isPending}
                onEditNotes={() => {
                  setNotesDraft(run.notes ?? '')
                  setNotesRun(run)
                }}
              />
            ))
          )}
        </div>
      </SidePanel>

      {/* Raw input / output */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {viewing?.what === 'input' ? t('viewInput') : t('output')} —{' '}
              {t('runTitle', { number: viewing?.run.run_number ?? '' })}
            </DialogTitle>
          </DialogHeader>
          {viewedPayload ? (
            <RunOutputViewer output={viewedPayload} />
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </DialogContent>
      </Dialog>

      {/* Notes */}
      <Dialog open={!!notesRun} onOpenChange={(open) => !open && setNotesRun(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{notesRun?.notes ? t('editNotes') : t('addNotes')}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className="min-h-[80px] resize-none text-xs"
            rows={4}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotesRun(null)}
              disabled={notesMutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => notesRun && notesMutation.mutate({ runId: notesRun.id, notes: notesDraft })}
              disabled={notesMutation.isPending}
            >
              {notesMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {t('saveNotes')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
