'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Group, Panel, Separator as PanelSeparator } from 'react-resizable-panels'
import { normativesApi, normativesRunsApi } from '@/lib/api'
import { NormativasRunsList } from '@/components/projects/NormativasRunsList'
import { NormativeSuggestionCard } from '@/components/projects/NormativeSuggestionCard'
import { NormativesSearchPanel } from '@/components/projects/NormativesSearchPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RunStatusBadge } from '@/components/pipeline/RunStatusBadge'
import {
  Play,
  Loader2,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
} from 'lucide-react'
import { isTerminalStatus } from '@/lib/utils'
import type { Project, NormativesRun, ProjectNormative, ProjectNormativeStatus } from '@/types'

interface NormativasViewProps {
  projectId: string
  project: Project
}

// ─── Context badge ────────────────────────────────────────────────────────────

function ContextBadge({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}:
      </span>
      <span className="text-[11px] text-foreground">
        {value ?? <span className="text-muted-foreground italic">—</span>}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NormativasView({ projectId, project }: NormativasViewProps) {
  const t = useTranslations('normativas')
  const tPipeline = useTranslations('pipeline')
  const queryClient = useQueryClient()

  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [activePollingRunId, setActivePollingRunId] = useState<string | null>(null)
  const [currentRun, setCurrentRun] = useState<NormativesRun | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Project normatives (confirmed + discarded) ─────────────────────────────
  const { data: projectNormatives = [] } = useQuery({
    queryKey: ['project-normatives', projectId],
    queryFn: () => normativesApi.getProjectNormatives(projectId),
  })

  // ── Selected run details (for suggestions) ────────────────────────────────
  const { data: selectedRun } = useQuery({
    queryKey: ['normativas-run', projectId, selectedRunId],
    queryFn: () => normativesRunsApi.get(projectId, selectedRunId!),
    enabled: !!selectedRunId,
  })

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activePollingRunId) return

    const poll = async () => {
      try {
        const run = await normativesRunsApi.get(projectId, activePollingRunId)
        setCurrentRun(run)
        if (isTerminalStatus(run.status)) {
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null
          setActivePollingRunId(null)
          queryClient.invalidateQueries({ queryKey: ['normativas-runs', projectId] })
          setSelectedRunId(run.id)
        }
      } catch {
        clearInterval(pollingIntervalRef.current!)
        pollingIntervalRef.current = null
        setActivePollingRunId(null)
      }
    }

    pollingIntervalRef.current = setInterval(poll, 5000)
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [activePollingRunId, projectId, queryClient])

  // ── Trigger mutation ───────────────────────────────────────────────────────
  const triggerMutation = useMutation({
    mutationFn: () => normativesApi.triggerSuggest(projectId),
    onSuccess: ({ run_id }) => {
      setActivePollingRunId(run_id)
      setSelectedRunId(run_id)
      queryClient.invalidateQueries({ queryKey: ['normativas-runs', projectId] })
    },
  })

  // ── Update normatives mutation ─────────────────────────────────────────────
  const updateNormativesMutation = useMutation({
    mutationFn: (normatives: Array<{ document_id: string; status: ProjectNormativeStatus }>) =>
      normativesApi.updateProjectNormatives(projectId, { normatives }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-normatives', projectId] })
    },
  })

  const handleConfirm = (documentId: string, status: ProjectNormativeStatus) => {
    const existing = projectNormatives
      .filter((n: ProjectNormative) => n.document_id !== documentId)
      .map((n: ProjectNormative) => ({ document_id: n.document_id, status: n.status }))
    updateNormativesMutation.mutate([...existing, { document_id: documentId, status }])
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const isRunning = !!activePollingRunId
  const confirmedIds = projectNormatives
    .filter((n: ProjectNormative) => n.status === 'confirmed')
    .map((n: ProjectNormative) => n.document_id)
  const discardedIds = projectNormatives
    .filter((n: ProjectNormative) => n.status === 'not_applicable')
    .map((n: ProjectNormative) => n.document_id)

  const suggestions = selectedRun?.suggestions ?? []
  const countriesDisplay = project.normative_target_countries?.join(', ') ?? null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
      <div className="border-b border-border px-4 py-3 shrink-0 space-y-2.5">
        {/* Context badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <ContextBadge label={t('industry')} value={project.normative_industry} />
          <ContextBadge label={t('clientType')} value={project.normative_client_type} />
          <ContextBadge label={t('userAge')} value={project.normative_user_age_range} />
          <ContextBadge label={t('countries')} value={countriesDisplay} />
          {project.normative_extra_context && (
            <ContextBadge label={t('extra')} value={project.normative_extra_context} />
          )}
        </div>

        {/* Extra context display + execute button */}
        <div className="flex items-center gap-3">
          {project.normative_extra_context ? (
            <p className="text-xs text-muted-foreground flex-1 line-clamp-1">
              <span className="font-medium text-foreground">{t('extraContextLabel')}: </span>
              {project.normative_extra_context}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground italic flex-1">
              {t('noExtraContext')}
            </span>
          )}

          <Button
            className="gap-2 shrink-0"
            onClick={() => triggerMutation.mutate()}
            disabled={isRunning || triggerMutation.isPending}
          >
            {isRunning || triggerMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {t('executeWorkflow')}
              </>
            )}
          </Button>
        </div>

        {/* Collapsed-column run strip */}
        {leftCollapsed && (
          <div className="flex items-center gap-2 pt-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title={t('showHistory')}
              onClick={() => setLeftCollapsed(false)}
            >
              <PanelLeftOpen className="h-3.5 w-3.5" />
            </Button>
            {currentRun || isRunning ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">
                  {tPipeline('runNumber')}{currentRun?.run_number ?? '…'}
                </span>
                {isRunning
                  ? <RunStatusBadge status="running" />
                  : currentRun && <RunStatusBadge status={currentRun.status} />}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{t('noActiveRuns')}</span>
            )}
          </div>
        )}
      </div>

      {/* ── 3-column layout ── */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full">

          {/* Left: Run history (collapsible) */}
          {!leftCollapsed && (
            <>
              <Panel defaultSize={22} minSize={15} className="flex flex-col overflow-hidden border-r border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {t('runHistory')}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title={t('hideHistory')}
                    onClick={() => setLeftCollapsed(true)}
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  <NormativasRunsList
                    projectId={projectId}
                    selectedRunId={selectedRunId}
                    onSelectRun={(run) => setSelectedRunId(run.id)}
                  />
                </div>
              </Panel>

              <PanelSeparator className="w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize relative group flex items-center justify-center">
                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </PanelSeparator>
            </>
          )}

          {/* Center: Suggestions */}
          <Panel
            defaultSize={leftCollapsed ? 50 : 40}
            minSize={25}
            className="flex flex-col overflow-hidden border-r border-border"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex-1">
                {t('suggestions')}
              </p>
              {selectedRun?.status === 'completed' && suggestions.length > 0 && (
                <Badge variant="muted" className="text-[10px]">
                  LLM Rank v2.4
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isRunning ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-xs">{t('analyzingNormatives')}</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <MapPin className="h-6 w-6 opacity-40" />
                  <p className="text-xs text-center">
                    {selectedRunId ? t('noSuggestionsForRun') : t('noSuggestionsHint')}
                  </p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <NormativeSuggestionCard
                    key={suggestion.document_id}
                    suggestion={suggestion}
                    confirmedIds={confirmedIds}
                    discardedIds={discardedIds}
                    onConfirm={handleConfirm}
                  />
                ))
              )}
            </div>
          </Panel>

          <PanelSeparator className="w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize relative group flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </PanelSeparator>

          {/* Right: Active normatives + search */}
          <Panel
            defaultSize={leftCollapsed ? 50 : 38}
            minSize={25}
            className="flex flex-col overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-border shrink-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t('projectNormatives')}
              </p>
            </div>

            <NormativesSearchPanel
              projectId={projectId}
              projectNormatives={projectNormatives}
            />
          </Panel>
        </Group>
      </div>
    </div>
  )
}
