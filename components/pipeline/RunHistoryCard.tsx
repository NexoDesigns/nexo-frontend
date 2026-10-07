'use client'

import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, ChevronDown, ExternalLink, Pencil, Star } from 'lucide-react'
import { RunStatusBadge } from './RunStatusBadge'
import { Button } from '@/components/ui/button'
import { RUN_STATUS_DOT } from '@/lib/design-constants'
import { n8nExecutionUrl } from '@/lib/constants'
import {
  cn,
  formatAbsoluteDate,
  formatDuration,
  formatRelativeDate,
  formatTokens,
} from '@/lib/utils'
import type { PhaseRun } from '@/types'

interface RunHistoryCardProps {
  run: PhaseRun
  authorName: string | undefined
  isActive: boolean
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onViewInput: () => void
  onViewOutput: () => void
  /** "Select run" */
  onConfirm: () => void
  isConfirming: boolean
  onEditNotes: () => void
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-xs">
      <span className="w-[72px] shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-foreground">{children}</span>
    </div>
  )
}

/** One run in a run history: click to show it, chevron for its details and actions. */
export function RunHistoryCard({
  run,
  authorName,
  isActive,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onViewInput,
  onViewOutput,
  onConfirm,
  isConfirming,
  onEditNotes,
}: RunHistoryCardProps) {
  const t = useTranslations('pipeline')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const inFlight = run.status === 'running' || run.status === 'pending'
  const when = formatRelativeDate(run.created_at, locale)
  const dot = inFlight
    ? RUN_STATUS_DOT.running
    : run.status === 'failed'
    ? RUN_STATUS_DOT.failed
    : isActive
    ? RUN_STATUS_DOT.active
    : RUN_STATUS_DOT.completed
  const n8nUrl = n8nExecutionUrl(run.phase_id, run.n8n_execution_id)

  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        isSelected ? 'border-primary bg-[#252C35]' : 'border-input bg-card hover:bg-[#252C35]'
      )}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-2.5 pl-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
          <span className="text-[13px] font-semibold text-foreground">#{run.run_number}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {inFlight ? t('runningSince', { time: when }) : `${authorName ?? '—'} · ${when}`}
          </span>
          {isActive && (
            <span className="shrink-0 rounded-full bg-success/15 px-[7px] py-px text-[10.5px] text-success">
              {t('activeBadge')}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          title={isExpanded ? t('hideDetails') : t('showDetails')}
          aria-label={isExpanded ? t('hideDetails') : t('showDetails')}
          className="mx-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2.5 border-t border-input px-3 pb-3 pt-2.5 animate-fade-in">
          <div className="space-y-1.5">
            <DetailRow label={tStatus('status')}>
              <RunStatusBadge status={run.status} />
            </DetailRow>
            <DetailRow label={t('started')}>{formatAbsoluteDate(run.created_at, locale)}</DetailRow>
            <DetailRow label={t('author')}>{authorName ?? '—'}</DetailRow>
            {run.duration_seconds !== null && (
              <DetailRow label={t('duration')}>{formatDuration(run.duration_seconds)}</DetailRow>
            )}
            {run.llm_tokens_used !== null && (
              <DetailRow label={t('tokensUsed')}>{formatTokens(run.llm_tokens_used)}</DetailRow>
            )}
            <DetailRow label={t('notes')}>
              <span className="inline-flex items-start gap-1.5">
                {run.notes ? (
                  <span className="whitespace-pre-wrap">{run.notes}</span>
                ) : null}
                <button
                  type="button"
                  onClick={onEditNotes}
                  className="inline-flex shrink-0 items-center gap-1 text-[#E0894A] hover:text-[#F0A56B]"
                >
                  <Pencil className="h-3 w-3" />
                  {run.notes ? t('editNotes') : t('addNotes')}
                </button>
              </span>
            </DetailRow>
          </div>

          {run.status === 'failed' && run.error_message && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-words font-mono">{run.error_message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onViewInput}>
              {t('viewInput')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onViewOutput}
              disabled={run.status !== 'completed' && !run.output_payload}
            >
              {t('viewOutput')}
            </Button>
            {run.status === 'completed' && !isActive && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={onConfirm}
                disabled={isConfirming}
              >
                <Star className="h-3 w-3" />
                {t('selectRun')}
              </Button>
            )}
            {n8nUrl && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" asChild>
                <a href={n8nUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                  {t('viewInN8n')}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
