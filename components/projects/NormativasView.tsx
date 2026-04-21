'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Textarea } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Group, Panel, Separator as PanelSeparator } from 'react-resizable-panels'
import { normativesApi, normativesRunsApi } from '@/lib/api'
import { NormativasRunsList } from '@/components/projects/NormativasRunsList'
import { NormativeSuggestionCard } from '@/components/projects/NormativeSuggestionCard'
import { NormativesSearchPanel } from '@/components/projects/NormativesSearchPanel'
import { DecisionTreeView } from '@/components/projects/normatives/DecisionTreeView'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import {
  Play,
  Loader2,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import type { Project, NormativeSuggestion } from '@/types'

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
  const tReq = useTranslations('requirements')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [directSuggestions, setDirectSuggestions] = useState<NormativeSuggestion[]>([])
  const [extraContext, setExtraContext] = useState('')

  // ── Project normatives (confirmed + discarded) ─────────────────────────────
  const { data: projectNormatives = [] } = useQuery({
    queryKey: ['project-normatives', projectId],
    queryFn: async () => {
      const data = await normativesApi.getProjectNormatives(projectId)
      console.log('[NormativasView] getProjectNormatives:', data)
      return data
    },
  })

  // ── Selected run details (for suggestions) ────────────────────────────────
  const { data: selectedRun } = useQuery({
    queryKey: ['normativas-run', projectId, selectedRunId],
    queryFn: () => normativesRunsApi.get(projectId, selectedRunId!),
    enabled: !!selectedRunId,
  })

  // ── Trigger mutation ───────────────────────────────────────────────────────
  const triggerMutation = useMutation({
    mutationFn: () => normativesApi.triggerSuggest(projectId, extraContext.trim() || undefined),
    onSuccess: (data) => {
      const suggestions = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>)?.suggestions)
          ? (data as { suggestions: NormativeSuggestion[] }).suggestions
          : []
      setDirectSuggestions(suggestions)
      setSelectedRunId(null)
    },
    onError: (error) => {
      console.error('[NormativasView] triggerSuggest error:', error)
    },
  })

  // ── Update normatives mutation ─────────────────────────────────────────────
  const updateNormativesMutation = useMutation({
    mutationFn: (document_ids: string[]) =>
      normativesApi.updateProjectNormatives(projectId, { document_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-normatives', projectId] })
    },
  })

  const handleConfirm = (documentId: string) => {
    const existingIds = projectNormatives
      .filter((n) => n.id !== documentId)
      .map((n) => n.id)
    updateNormativesMutation.mutate([...existingIds, documentId])
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const confirmedIds = projectNormatives.map((n) => n.id)
  const discardedIds: string[] = []

  // Run suggestions take priority; fall back to direct suggestions from last trigger
  const suggestions: NormativeSuggestion[] = selectedRun?.suggestions ?? directSuggestions
  const countriesDisplay = project.normative_target_countries?.join(', ') ?? null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Tabs defaultValue="seleccion" className="flex flex-col h-full overflow-hidden">

      {/* ── Sub-tab bar ── */}
      <div className="border-b border-border px-4 pt-2 shrink-0">
        <TabsList className="bg-transparent gap-0 h-auto p-0 rounded-none">
          <TabsTrigger
            value="seleccion"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
          >
            <ListChecks className="h-3.5 w-3.5" />
            Selección de normativas
          </TabsTrigger>
          <TabsTrigger
            value="sugerencias"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sugerencias
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── Selección de normativas tab ── */}
      <TabsContent value="seleccion" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
        <DecisionTreeView projectId={projectId} />
      </TabsContent>

      {/* ── Sugerencias tab ── */}
      <TabsContent value="sugerencias" className="flex-1 overflow-hidden mt-0 flex flex-col data-[state=inactive]:hidden">
      <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
      <div className="border-b border-border px-4 py-3 shrink-0 space-y-2.5">
        {/* Context badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <ContextBadge label={t('industry')} value={project.normative_industry} />
          <ContextBadge label={t('clientType')} value={project.normative_client_type} />
          <ContextBadge label={t('userAge')} value={project.normative_user_age_range} />
          <ContextBadge label={t('countries')} value={countriesDisplay} />
        </div>

        {/* Extra context prompt + execute button */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {tReq('promptLabel')}
            <span className="normal-case font-normal ml-1">({tCommon('optional')})</span>
          </p>
          <div className="flex items-start gap-3">
            <Textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder={tReq('promptPlaceholder')}
              className="text-xs min-h-[60px] resize-none flex-1"
              disabled={triggerMutation.isPending}
            />
            <Button
              className="gap-2 shrink-0"
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
            >
              {triggerMutation.isPending ? (
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
        </div>

        {/* Collapsed-column toggle */}
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
                    onSelectRun={(run) => {
                      setSelectedRunId(run.id)
                      setDirectSuggestions([])
                    }}
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
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {triggerMutation.isPending ? (
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
      </TabsContent>

    </Tabs>
  )
}
