'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { requirementsRunsApi, profilesApi } from '@/lib/api'
import { n8nRequirementsUrl } from '@/lib/constants'
import { RunStatusBadge } from '@/components/pipeline/RunStatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { formatRelativeDate, formatDuration } from '@/lib/utils'
import type { RequirementsRun } from '@/types'
import { cn } from '@/lib/utils'

interface RequirementsRunsListProps {
  projectId: string
  selectedRunId?: string
  onSelectRun: (run: RequirementsRun, viewMode: 'input' | 'output') => void
}

export function RequirementsRunsList({
  projectId,
  selectedRunId,
  onSelectRun,
}: RequirementsRunsListProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const tReq = useTranslations('requirements')
  const locale = useLocale()
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const { data: runs, isLoading, isError } = useQuery({
    queryKey: ['requirements-runs', projectId],
    queryFn: () => requirementsRunsApi.list(projectId),
  })

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? [])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-destructive">
        {tCommon('error')}
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
    <div className="space-y-1">
      {runs.map((run) => {
        const isSelected = run.id === selectedRunId
        const isExpanded = expandedRunId === run.id

        return (
          <div
            key={run.id}
            className={cn(
              'rounded-md border transition-colors',
              isSelected
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:border-border/80'
            )}
          >
            {/* Run header row */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setExpandedRunId(isExpanded ? null : run.id)
                }
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
            >
              <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                {t('runNumber')}{run.run_number}
              </span>

              <RunStatusBadge status={run.status} />

              <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                {run.duration_seconds !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(run.duration_seconds)}
                  </span>
                )}
                {profileMap.get(run.created_by) && (
                  <span className="hidden sm:inline">
                    {profileMap.get(run.created_by)}
                  </span>
                )}
                <span>{formatRelativeDate(run.created_at, locale)}</span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </div>
            </div>

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
                  {/* View input in panel */}
                  {run.input_drive_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => onSelectRun(run, 'input')}
                    >
                      {tReq('inputExcel')}
                    </Button>
                  )}

                  {/* View output in panel */}
                  {run.output_drive_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5"
                      onClick={() => onSelectRun(run, 'output')}
                    >
                      {tReq('outputExcel')}
                    </Button>
                  )}

                  {/* Open output in Drive */}
                  {run.output_drive_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1.5 text-muted-foreground"
                      asChild
                    >
                      <a
                        href={run.output_drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {tReq('openInDrive')}
                      </a>
                    </Button>
                  )}

                  {/* View in n8n */}
                  {(() => {
                    const url = n8nRequirementsUrl(run.n8n_execution_id)
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
  )
}
