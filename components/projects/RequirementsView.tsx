'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Group, Panel, Separator as PanelSeparator } from 'react-resizable-panels'
import { projectsApi, requirementsRunsApi, profilesApi } from '@/lib/api'
import { DriveEmbed } from '@/components/projects/DriveEmbed'
import { RunStatusBadge } from '@/components/pipeline/RunStatusBadge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pencil,
  ExternalLink,
  Play,
  GripVertical,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { cn, formatDuration, formatRelativeDate, isTerminalStatus } from '@/lib/utils'
import type { Project, RequirementsRun } from '@/types'

interface RequirementsViewProps {
  projectId: string
  project: Project
}

export function RequirementsView({ projectId, project }: RequirementsViewProps) {
  const t = useTranslations('requirements')
  const tCommon = useTranslations('common')
  const tPipeline = useTranslations('pipeline')
  const locale = useLocale()
  const queryClient = useQueryClient()

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedRun, setSelectedRun] = useState<RequirementsRun | null>(null)
  const [viewMode, setViewMode] = useState<'input' | 'output'>('input')
  const [prompt, setPrompt] = useState('')
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState(project.requirements_input_drive_url ?? '')
  const [activePollingRunId, setActivePollingRunId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['requirements-runs', projectId],
    queryFn: () => requirementsRunsApi.list(projectId),
    initialData: [],
    retry: false,
  })

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesApi.list,
  })

  const profileMap = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles]
  )

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activePollingRunId) return

    const poll = async () => {
      try {
        const run = await requirementsRunsApi.get(projectId, activePollingRunId)
        if (isTerminalStatus(run.status)) {
          clearInterval(pollingIntervalRef.current!)
          pollingIntervalRef.current = null
          setActivePollingRunId(null)
          queryClient.invalidateQueries({ queryKey: ['requirements-runs', projectId] })
          setSelectedRun(run)
          if (run.output_drive_url) setViewMode('output')
        }
      } catch {
        // backend not yet implemented — stop polling silently
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

  // ── Mutations ──────────────────────────────────────────────────────────────
  const triggerMutation = useMutation({
    mutationFn: () =>
      requirementsRunsApi.trigger(projectId, {
        custom_prompt: prompt.trim() || undefined,
      }),
    onSuccess: ({ run_id }) => {
      setActivePollingRunId(run_id)
      queryClient.invalidateQueries({ queryKey: ['requirements-runs', projectId] })
    },
  })

  const updateUrlMutation = useMutation({
    mutationFn: (url: string) =>
      projectsApi.update(projectId, { requirements_input_drive_url: url || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setEditingUrl(false)
    },
  })

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isRunning = !!activePollingRunId
  const currentDriveUrl = project.requirements_input_drive_url

  const activeViewUrl =
    viewMode === 'input'
      ? currentDriveUrl
      : selectedRun?.output_drive_url ?? null

  const openInDrive = (url: string | null) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleSaveUrl = () => {
    updateUrlMutation.mutate(urlInput)
  }

  const handleCancelUrl = () => {
    setUrlInput(project.requirements_input_drive_url ?? '')
    setEditingUrl(false)
  }

  const handleSelectRun = (run: RequirementsRun) => {
    setSelectedRun(run)
    setViewMode(run.output_drive_url ? 'output' : 'input')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Group orientation="horizontal" className="h-full">
      {/* ── Left panel ── */}
      <Panel defaultSize={300} minSize={15} className="flex flex-col overflow-hidden border-r border-border">
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Input Excel section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('inputExcel')}
            </p>

            {/* Drive URL row */}
            {editingUrl ? (
              <div className="space-y-1.5">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={t('driveUrlPlaceholder')}
                  className="text-xs h-8"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={handleSaveUrl}
                    disabled={updateUrlMutation.isPending}
                  >
                    {updateUrlMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    {tCommon('save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={handleCancelUrl}
                  >
                    <X className="h-3 w-3" />
                    {tCommon('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
                  {currentDriveUrl ? (
                    <span className="text-foreground font-mono">
                      {currentDriveUrl.replace('https://docs.google.com/spreadsheets/d/', '').slice(0, 20)}…
                    </span>
                  ) : (
                    <span className="italic">{t('noDriveUrl')}</span>
                  )}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setUrlInput(currentDriveUrl ?? '')
                    setEditingUrl(true)
                  }}
                  title={tCommon('edit')}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Action buttons */}
            {currentDriveUrl && !editingUrl && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={() => {
                    setViewMode('input')
                    setSelectedRun(null)
                  }}
                >
                  {t('inputExcel')}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7 shrink-0"
                  onClick={() => openInDrive(currentDriveUrl)}
                  title={t('openInDrive')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Prompt section */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('promptLabel')}
              <span className="normal-case font-normal ml-1">({tCommon('optional')})</span>
            </p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('promptPlaceholder')}
              className="text-xs min-h-[80px] resize-none"
              disabled={isRunning}
            />
          </div>

          {/* Run button */}
          <Button
            className="w-full gap-2"
            onClick={() => triggerMutation.mutate()}
            disabled={isRunning || triggerMutation.isPending}
          >
            {isRunning || triggerMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('workflowRunning')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {runs && runs.length > 0 ? t('reExecuteWorkflow') : t('executeWorkflow')}
              </>
            )}
          </Button>

          {/* Run history */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {tPipeline('runHistory')}
            </p>

            {runsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : !runs || runs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                {tPipeline('noRuns')}
              </p>
            ) : (
              <div className="space-y-1.5">
                {[...runs].reverse().map((run) => (
                  <button
                    key={run.id}
                    onClick={() => handleSelectRun(run)}
                    className={cn(
                      'w-full text-left rounded-md border px-3 py-2 space-y-1 transition-colors',
                      'hover:bg-accent hover:border-accent-foreground/20',
                      selectedRun?.id === run.id
                        ? 'border-primary/50 bg-accent'
                        : 'border-border bg-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">
                        {tPipeline('runNumber')}{run.run_number}
                      </span>
                      <RunStatusBadge status={run.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {run.duration_seconds != null && (
                        <span>{formatDuration(run.duration_seconds)}</span>
                      )}
                      <span className="truncate">
                        {formatRelativeDate(run.created_at, locale)}
                      </span>
                    </div>
                    {profileMap[run.created_by] && (
                      <p className="text-xs text-muted-foreground truncate">
                        {t('runBy', { name: profileMap[run.created_by] })}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* ── Resize handle ── */}
      <PanelSeparator className="w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize relative group flex items-center justify-center">
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </PanelSeparator>

      {/* ── Right panel ── */}
      <Panel minSize={40} className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border shrink-0">
          {/* Toggle */}
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <button
              onClick={() => setViewMode('input')}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors',
                viewMode === 'input'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('inputExcel')}
            </button>
            <button
              onClick={() => setViewMode('output')}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors',
                viewMode === 'output'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('outputExcel')}
            </button>
          </div>

          {/* Open in Drive */}
          {activeViewUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1.5"
              onClick={() => openInDrive(activeViewUrl)}
            >
              <ExternalLink className="h-3 w-3" />
              {t('openInDrive')}
            </Button>
          )}
        </div>

        {/* Embed */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'input' ? (
            <DriveEmbed
              driveUrl={currentDriveUrl}
              emptyTitle={t('noDriveUrl')}
              emptyHint={t('noDriveUrlHint')}
            />
          ) : (
            <DriveEmbed
              driveUrl={selectedRun?.output_drive_url ?? null}
              emptyTitle={t('noOutputYet')}
              emptyHint={t('noOutputHint')}
            />
          )}
        </div>
      </Panel>
    </Group>
  )
}
