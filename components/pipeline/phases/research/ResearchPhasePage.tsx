'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { AlertCircle, Info, Loader2, Plus } from 'lucide-react'
import { profilesApi, runsApi } from '@/lib/api'
import { parseResearchOutput } from '@/lib/research'
import { formatDuration, formatRelativeDate, cn } from '@/lib/utils'
import { useProjectPhases } from '@/hooks/useProjectPhases'
import { useActiveRuns, usePhaseRuns, usePipelineState } from '@/hooks/usePipelineState'
import { usePhaseSelections } from '@/hooks/usePhaseSelections'
import { useResearchRun } from '@/hooks/useResearchRun'
import { useDismiss } from '@/hooks/useDismiss'
import { usePhaseName } from '../../usePhaseName'
import { RunHistoryPanel } from '../../RunHistoryPanel'
import { PhaseBlockedBanner } from '../PhasePageHeader'
import { NewRunPopover } from './NewRunPopover'
import { RunFinishedNotice } from './RunFinishedNotice'
import { SolutionList } from './SolutionList'
import { Skeleton } from '@/components/ui/skeleton'
import type { PhasePageProps } from '..'
import type { RunStatus } from '@/types'

const inFlight = (s: RunStatus | undefined) => s === 'pending' || s === 'running'
const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join('\u0000') === [...b].sort().join('\u0000')

/**
 * Research phase page (design 4a): new run on top, the selected run's
 * solutions below, run history docked on the right.
 */
export function ResearchPhasePage({ project, phase }: PhasePageProps) {
  const projectId = project.id
  const t = useTranslations('pipeline')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const phaseName = usePhaseName()

  // ─── Pipeline context ──────────────────────────────────────────────────────
  const { phases, getPrevious } = useProjectPhases(project)
  const { states } = usePipelineState(projectId, phases)
  const phaseIndex = phases.findIndex((p) => p.id === phase.id)
  const nextPhase = phaseIndex >= 0 ? phases[phaseIndex + 1] : undefined
  const nextPhaseName = nextPhase ? phaseName(nextPhase) : ''
  const previousPhase = getPrevious(phase.id)

  // ─── Runs ──────────────────────────────────────────────────────────────────
  const { data: activeRuns } = useActiveRuns(projectId)
  const activeRunId = activeRuns?.find((a) => a.phase_id === 'research')?.run_id ?? null
  const { data: runs, isLoading: runsLoading } = usePhaseRuns(projectId, 'research')
  const sortedRuns = useMemo(
    () => [...(runs ?? [])].sort((a, b) => b.run_number - a.run_number),
    [runs]
  )
  const hasRunInFlight = sortedRuns.some((r) => inFlight(r.status))

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const viewedRunId = selectedRunId ?? activeRunId ?? sortedRuns[0]?.id ?? null
  const listRun = sortedRuns.find((r) => r.id === viewedRunId)
  const research = useResearchRun(projectId, viewedRunId)
  // The list is polled, so its status is the freshest one
  const status = listRun?.status ?? research.run?.status
  const viewedRun = research.run ?? listRun
  const isActive = !!viewedRunId && viewedRunId === activeRunId

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list(),
    staleTime: 5 * 60 * 1000,
  })
  const authorName = profiles?.find((p) => p.id === viewedRun?.created_by)?.full_name

  // custom_inputs of the active run seed the New Run form
  const { data: activeRun } = useQuery({
    queryKey: ['run', projectId, 'research', activeRunId],
    queryFn: () => runsApi.get(projectId, 'research', activeRunId!),
    enabled: !!activeRunId,
  })

  // ─── A run finished while another one is on screen ─────────────────────────
  const [notice, setNotice] = useState<{ runId: string; number: number; failed: boolean } | null>(null)
  const prevStatuses = useRef<Map<string, RunStatus> | null>(null)
  const viewedRunIdRef = useRef(viewedRunId)
  viewedRunIdRef.current = viewedRunId

  useEffect(() => {
    if (!runs) return
    const prev = prevStatuses.current
    if (prev) {
      for (const r of runs) {
        const before = prev.get(r.id)
        if (inFlight(before) && (r.status === 'completed' || r.status === 'failed')) {
          queryClient.invalidateQueries({ queryKey: ['run', projectId, 'research', r.id] })
          queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
          if (r.id !== viewedRunIdRef.current) {
            setNotice({ runId: r.id, number: r.run_number, failed: r.status === 'failed' })
          }
        }
      }
    }
    prevStatuses.current = new Map(runs.map((r) => [r.id, r.status]))
  }, [runs, projectId, queryClient])

  const selectRun = (runId: string) => {
    setSelectedRunId(runId)
    setDraft(null)
    if (notice?.runId === runId) setNotice(null)
  }

  // ─── Selection draft ───────────────────────────────────────────────────────
  const selections = usePhaseSelections(projectId)
  const saved = selections.get('research', viewedRunId)
  const savedIds = useMemo(
    () => saved?.selected_ids.filter((id) => research.allSolutions.some((s) => s.id === id)) ?? [],
    [saved, research.allSolutions]
  )
  const defaultIds = savedIds.length > 0 ? savedIds : research.originals.map((s) => s.id)
  const [draft, setDraft] = useState<{ runId: string; ids: string[] } | null>(null)
  const draftIds = draft && draft.runId === viewedRunId ? draft.ids : defaultIds

  const defaultIdsRef = useRef(defaultIds)
  defaultIdsRef.current = defaultIds
  const updateDraft = useCallback(
    (fn: (ids: string[]) => string[]) => {
      if (!viewedRunId) return
      setDraft((prev) => {
        const base = prev && prev.runId === viewedRunId ? prev.ids : defaultIdsRef.current
        return { runId: viewedRunId, ids: fn(base) }
      })
    },
    [viewedRunId]
  )

  const onRenameId = (oldId: string, newId: string) => {
    updateDraft((ids) => ids.map((i) => (i === oldId ? newId : i)))
    if (viewedRunId && saved?.selected_ids.includes(oldId)) {
      selections.save.mutate({
        phaseId: 'research',
        sourceRunId: viewedRunId,
        ids: saved.selected_ids.map((i) => (i === oldId ? newId : i)),
      })
    }
  }

  // ─── Select run: activate it (if needed) and save which solutions go on ────
  // The viewed run sends the current ticks. Another run (from the history)
  // sends its saved selection, or all of its solutions.
  const confirmSelection = useMutation({
    mutationFn: async (runId: string) => {
      let ids = draftIds
      if (runId !== viewedRunId) {
        const savedIds = selections.get('research', runId)?.selected_ids
        if (savedIds?.length) {
          ids = savedIds
        } else {
          const run = await queryClient.fetchQuery({
            queryKey: ['run', projectId, 'research', runId],
            queryFn: () => runsApi.get(projectId, 'research', runId),
          })
          ids = parseResearchOutput(run.output_payload).flatMap((item) => item.solutions.map((s) => s.id))
        }
      }
      if (runId !== activeRunId) await runsApi.activate(projectId, 'research', runId)
      await selections.save.mutateAsync({ phaseId: 'research', sourceRunId: runId, ids })
    },
    onSuccess: (_, runId) => {
      if (runId === viewedRunId) setDraft(null)
      queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, 'research'] })
    },
  })

  const canConfirm =
    status === 'completed' &&
    draftIds.length > 0 &&
    (!isActive || !saved || !sameIds(draftIds, saved.selected_ids)) &&
    !confirmSelection.isPending

  // ─── New run popover ───────────────────────────────────────────────────────
  const [newRunOpen, setNewRunOpen] = useState(false)
  const newRunButtonRef = useRef<HTMLButtonElement>(null)
  const newRunPopoverRef = useRef<HTMLDivElement>(null)
  const closeNewRun = useCallback(() => setNewRunOpen(false), [])
  useDismiss([newRunButtonRef, newRunPopoverRef], closeNewRun, newRunOpen)

  return (
    <div className="flex min-h-0 flex-1">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-7 pb-8 pt-6">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-2xl font-semibold text-foreground">{phaseName(phase)}</h1>
            <span className="flex-1" />
            <div className="relative">
              <button
                ref={newRunButtonRef}
                type="button"
                onClick={() => setNewRunOpen((v) => !v)}
                disabled={hasRunInFlight}
                title={hasRunInFlight ? t('runInProgress') : undefined}
                aria-expanded={newRunOpen}
                className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[5px] bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-[#D2732A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasRunInFlight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('newRun')}
              </button>
              {newRunOpen && (
                <NewRunPopover
                  ref={newRunPopoverRef}
                  project={project}
                  defaultInputs={(activeRun?.input_payload?.custom_inputs as Record<string, unknown>) ?? {}}
                  onStarted={(runId) => {
                    setNewRunOpen(false)
                    setNotice(null)
                    selectRun(runId)
                  }}
                  onClose={closeNewRun}
                />
              )}
            </div>
          </div>

          {states[phase.id]?.locked && previousPhase && (
            <PhaseBlockedBanner projectId={projectId} previousPhase={previousPhase} />
          )}

          {notice && (
            <RunFinishedNotice
              runNumber={notice.number}
              failed={notice.failed}
              onShow={() => selectRun(notice.runId)}
              onDismiss={() => setNotice(null)}
            />
          )}

          {runsLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-32" />
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !viewedRunId ? (
            <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-[13px] text-muted-foreground">
              {t('noRunsYet')}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {/* Run title + meta */}
              <div className="flex items-center gap-2.5 pt-5">
                <span className="text-base font-semibold text-foreground">
                  {t('runTitle', { number: viewedRun?.run_number ?? '' })}
                </span>
                {isActive && status === 'completed' && (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">
                    {t('activeBadge')}
                  </span>
                )}
              </div>
              <div className="-mt-1.5 flex items-center gap-2.5">
                <span className="flex-1" />
                {viewedRun && (
                  <span className="text-xs text-muted-foreground">
                    {[
                      authorName,
                      formatRelativeDate(viewedRun.created_at, locale),
                      viewedRun.duration_seconds !== null ? formatDuration(viewedRun.duration_seconds) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </div>

              {/* Body by status */}
              {inFlight(status) && (
                <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-[13px] text-muted-foreground">
                  {t('runningBox')}
                </div>
              )}

              {status === 'failed' && (
                <div className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-[rgba(255,122,92,.35)] bg-[rgba(255,122,92,.08)] px-3.5 py-3 text-[13px] leading-normal text-[#FFB3A1]">
                  {viewedRun?.error_message || t('runFailedNotice', { number: viewedRun?.run_number ?? '' })}
                </div>
              )}

              {status === 'completed' && (
                <>
                  {research.isLoading ? (
                    <div className="flex flex-col gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {research.items
                        .filter((item) => item.error)
                        .map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
                          >
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono">{item.error}</span>
                          </div>
                        ))}
                      {research.originals.length === 0 && (
                        <p className="text-xs italic text-muted-foreground">{t('noDesignsInOutput')}</p>
                      )}
                      <SolutionList
                        key={viewedRunId}
                        research={research}
                        draftIds={draftIds}
                        onToggle={(id) =>
                          updateDraft((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]))
                        }
                        onAddToDraft={(id) => updateDraft((ids) => (ids.includes(id) ? ids : [...ids, id]))}
                        onRemoveFromDraft={(id) => updateDraft((ids) => ids.filter((i) => i !== id))}
                        onRenameId={onRenameId}
                        nextPhaseName={nextPhaseName}
                      />
                    </>
                  )}

                  {/* Bottom bar */}
                  <div className="flex items-center gap-2.5 pt-8">
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() => viewedRunId && confirmSelection.mutate(viewedRunId)}
                      disabled={!canConfirm}
                      className={cn(
                        'flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-[5px] px-3.5 text-[12.5px] font-semibold transition-colors',
                        canConfirm
                          ? 'bg-primary text-primary-foreground hover:bg-[#D2732A]'
                          : 'cursor-not-allowed bg-accent text-[#6F7A8B]'
                      )}
                    >
                      {confirmSelection.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t('selectRun')}
                    </button>
                    {nextPhase && (
                      <TooltipPrimitive.Provider delayDuration={150}>
                        <TooltipPrimitive.Root>
                          <TooltipPrimitive.Trigger asChild>
                            <span className="ml-1.5 flex cursor-help text-muted-foreground" tabIndex={0}>
                              <Info className="h-4 w-4" />
                            </span>
                          </TooltipPrimitive.Trigger>
                          <TooltipPrimitive.Portal>
                            <TooltipPrimitive.Content
                              side="bottom"
                              align="end"
                              sideOffset={8}
                              className="z-50 w-[260px] rounded-md border border-border bg-accent px-3 py-2.5 text-xs leading-normal text-foreground shadow-[0_8px_24px_rgba(0,0,0,.4)]"
                            >
                              {t('selectRunTooltip', { phase: nextPhaseName })}
                            </TooltipPrimitive.Content>
                          </TooltipPrimitive.Portal>
                        </TooltipPrimitive.Root>
                      </TooltipPrimitive.Provider>
                    )}
                  </div>
                  {(confirmSelection.isError || selections.save.isError) && (
                    <p className="text-right text-xs text-destructive">
                      {confirmSelection.error instanceof Error
                        ? confirmSelection.error.message
                        : t('selectionSaveError')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <RunHistoryPanel
        projectId={projectId}
        phaseId="research"
        activeRunId={activeRunId}
        selectedRunId={viewedRunId}
        onSelect={selectRun}
        onConfirmRun={(runId) => confirmSelection.mutate(runId)}
        isConfirming={confirmSelection.isPending}
      />
    </div>
  )
}
