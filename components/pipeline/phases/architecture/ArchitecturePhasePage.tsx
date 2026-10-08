'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Loader2, Plus } from 'lucide-react'
import { profilesApi, runsApi } from '@/lib/api'
import { formatDuration, formatRelativeDate } from '@/lib/utils'
import { useProjectPhases } from '@/hooks/useProjectPhases'
import { useActiveRuns, usePhaseRuns, usePipelineState } from '@/hooks/usePipelineState'
import { useArchitectureEditor, useOpenEditorInNewTab } from '@/hooks/useArchitectureEditor'
import { useDismiss } from '@/hooks/useDismiss'
import { usePhaseName } from '../../usePhaseName'
import { RunHistoryPanel } from '../../RunHistoryPanel'
import { PhaseBlockedBanner } from '../PhasePageHeader'
import { RunFinishedNotice } from '../research/RunFinishedNotice'
import { ArchitectureEditorFrame } from './ArchitectureEditorFrame'
import { ArchitectureNewRunPopover } from './ArchitectureNewRunPopover'
import { Skeleton } from '@/components/ui/skeleton'
import type { PhasePageProps } from '..'
import type { RunStatus } from '@/types'

const PHASE_ID = 'architecture_agent'
const inFlight = (s: RunStatus | undefined) => s === 'pending' || s === 'running'

function DiagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="6" rx="1" />
      <rect x="14" y="15" width="7" height="6" rx="1" />
      <path d="M10 6h4v12" />
    </svg>
  )
}

/**
 * Architecture phase page (design 5a): new run on top, the selected run below
 * with a button that opens the diagram editor in the page's center, run
 * history docked on the right.
 */
export function ArchitecturePhasePage({ project, phase }: PhasePageProps) {
  const projectId = project.id
  const t = useTranslations('pipeline')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const phaseName = usePhaseName()
  const editor = useArchitectureEditor()

  // ─── Pipeline context ──────────────────────────────────────────────────────
  const { phases, getPrevious } = useProjectPhases(project)
  const { states } = usePipelineState(projectId, phases)
  const previousPhase = getPrevious(phase.id)

  // ─── Runs ──────────────────────────────────────────────────────────────────
  const { data: activeRuns } = useActiveRuns(projectId)
  const activeRunId = activeRuns?.find((a) => a.phase_id === PHASE_ID)?.run_id ?? null
  const { data: runs, isLoading: runsLoading } = usePhaseRuns(projectId, PHASE_ID)
  const sortedRuns = useMemo(
    () => [...(runs ?? [])].sort((a, b) => b.run_number - a.run_number),
    [runs]
  )
  const hasRunInFlight = sortedRuns.some((r) => inFlight(r.status))

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const viewedRunId = selectedRunId ?? editor.editorRunId ?? activeRunId ?? sortedRuns[0]?.id ?? null
  const viewedRun = sortedRuns.find((r) => r.id === viewedRunId)
  const status = viewedRun?.status
  const isActive = !!viewedRunId && viewedRunId === activeRunId

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list(),
    staleTime: 5 * 60 * 1000,
  })
  const authorName = profiles?.find((p) => p.id === viewedRun?.created_by)?.full_name

  // custom_inputs of the active run seed the New Run form
  const { data: activeRun } = useQuery({
    queryKey: ['run', projectId, PHASE_ID, activeRunId],
    queryFn: () => runsApi.get(projectId, PHASE_ID, activeRunId!),
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
          queryClient.invalidateQueries({ queryKey: ['run', projectId, PHASE_ID, r.id] })
          queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
          if (r.id !== viewedRunIdRef.current) {
            setNotice({ runId: r.id, number: r.run_number, failed: r.status === 'failed' })
          }
        }
      }
    }
    prevStatuses.current = new Map(runs.map((r) => [r.id, r.status]))
  }, [runs, projectId, queryClient])

  // Picking a run in the history closes the editor, as in the design
  const selectRun = (runId: string) => {
    setSelectedRunId(runId)
    if (notice?.runId === runId) setNotice(null)
    if (editor.isEditorOpen) editor.closeEditor()
  }

  const invalidateRuns = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['active-runs', projectId] })
    queryClient.invalidateQueries({ queryKey: ['runs', projectId, PHASE_ID] })
  }, [queryClient, projectId])

  const activateRun = useMutation({
    mutationFn: (runId: string) => runsApi.activate(projectId, PHASE_ID, runId),
    onSuccess: invalidateRuns,
  })

  const openInNewTab = useOpenEditorInNewTab(projectId, viewedRunId)

  // ─── New run popover ───────────────────────────────────────────────────────
  const [newRunOpen, setNewRunOpen] = useState(false)
  const newRunButtonRef = useRef<HTMLButtonElement>(null)
  const newRunPopoverRef = useRef<HTMLDivElement>(null)
  const closeNewRun = useCallback(() => setNewRunOpen(false), [])
  useDismiss([newRunButtonRef, newRunPopoverRef], closeNewRun, newRunOpen)

  return (
    <div className="flex min-h-0 flex-1">
      {editor.editorRunId ? (
        <ArchitectureEditorFrame
          key={editor.editorRunId}
          projectId={projectId}
          runId={editor.editorRunId}
          onApproved={() => {
            invalidateRuns()
            editor.closeEditor()
          }}
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-full flex-col gap-6 px-7 pb-7 pt-6">
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
                  <ArchitectureNewRunPopover
                    ref={newRunPopoverRef}
                    projectId={projectId}
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
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="min-h-[240px] w-full flex-1 rounded-lg" />
              </div>
            ) : !viewedRunId ? (
              <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-[13px] text-muted-foreground">
                {t('noRunsYet')}
              </div>
            ) : (
              <>
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
                  <span className="flex-1" />
                  {status === 'completed' && !isActive && (
                    <button
                      type="button"
                      onClick={() => viewedRunId && activateRun.mutate(viewedRunId)}
                      disabled={activateRun.isPending}
                      className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-border px-3 text-[12.5px] text-foreground transition-colors hover:border-primary disabled:opacity-50"
                    >
                      {activateRun.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t('activateRun')}
                    </button>
                  )}
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
                {activateRun.isError && (
                  <p className="-mt-4 text-right text-xs text-destructive">
                    {activateRun.error instanceof Error ? activateRun.error.message : t('launchError')}
                  </p>
                )}

                {/* Body by status */}
                <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-5 py-10">
                  {status === 'completed' && (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!viewedRunId) return
                            // Keep this run on screen when the editor closes
                            setSelectedRunId(viewedRunId)
                            editor.openEditor(viewedRunId)
                          }}
                          className="flex h-10 items-center gap-2 whitespace-nowrap rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#D2732A]"
                        >
                          <DiagramIcon />
                          {t('openDiagramEditor')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openInNewTab.mutate()}
                          disabled={openInNewTab.isPending}
                          title={t('openDiagramEditorNewTab')}
                          aria-label={t('openDiagramEditorNewTab')}
                          className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                        >
                          {openInNewTab.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {openInNewTab.isError && (
                        <p className="text-xs text-destructive">
                          {openInNewTab.error instanceof Error
                            ? openInNewTab.error.message
                            : t('architectureDiagramLoadError')}
                        </p>
                      )}
                    </>
                  )}

                  {inFlight(status) && <span className="text-[13px] text-muted-foreground">{t('runningBox')}</span>}

                  {status === 'failed' && (
                    // Long errors (a stack trace can run to thousands of characters) scroll
                    // inside the card, so it never outgrows the centred box
                    <div className="max-h-[40vh] w-full max-w-[560px] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-[rgba(255,122,92,.35)] bg-[rgba(255,122,92,.08)] px-3.5 py-3 text-[13px] leading-normal text-[#FFB3A1]">
                      {viewedRun?.error_message || t('runFailedNotice', { number: viewedRun?.run_number ?? '' })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <RunHistoryPanel
        projectId={projectId}
        phaseId={PHASE_ID}
        activeRunId={activeRunId}
        selectedRunId={viewedRunId}
        onSelect={selectRun}
      />
    </div>
  )
}
