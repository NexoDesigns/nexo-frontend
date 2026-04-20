'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation } from '@tanstack/react-query'
import { normativesApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NormativeDetailModal } from '@/components/projects/NormativeDetailModal'
import { Info, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NormativeSuggestion } from '@/types'

interface NormativeSuggestionCardProps {
  suggestion: NormativeSuggestion
  confirmedIds: string[]
  discardedIds: string[]
  onConfirm: (documentId: string) => void
}

export function NormativeSuggestionCard({
  suggestion,
  confirmedIds,
  discardedIds,
  onConfirm,
}: NormativeSuggestionCardProps) {
  const t = useTranslations('normativas')
  const [detailOpen, setDetailOpen] = useState(false)

  const isConfirmed = confirmedIds.includes(suggestion.document_id)
  const isDiscarded = discardedIds.includes(suggestion.document_id)
  const isTagged = isConfirmed || isDiscarded

  const downloadMutation = useMutation({
    mutationFn: () => normativesApi.getDownloadUrl(suggestion.document_id),
    onSuccess: ({ url }) => window.open(url, '_blank', 'noopener,noreferrer'),
  })

  return (
    <>
      <div
        className={cn(
          'relative rounded-lg border p-4 space-y-3 transition-colors',
          isConfirmed
            ? 'border-success/40 bg-success/5'
            : isDiscarded
            ? 'border-border bg-muted/30 opacity-60'
            : 'border-border bg-card'
        )}
      >
        {/* Already-tagged label */}
        {isTagged && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1">
            {isConfirmed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-success">{t('alreadyConfirmed')}</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t('alreadyDiscarded')}</span>
              </>
            )}
          </div>
        )}

        {/* Header: code + relevance badge + score */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-foreground leading-tight">
            {suggestion.standard_code}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {suggestion.score !== undefined && (
              <span className="text-[11px] text-muted-foreground">
                {t('score')}: {(suggestion.score * 100).toFixed(1)}%
              </span>
            )}
            <Badge
              variant={suggestion.relevance === 'mandatory' ? 'destructive' : 'warning'}
              className="text-[10px] uppercase tracking-wide"
            >
              {suggestion.relevance === 'mandatory' ? t('mandatory') : t('recommended')}
            </Badge>
          </div>
        </div>

        {/* Reason */}
        {suggestion.relevance_reason && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {suggestion.relevance_reason}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            title={t('viewDetails')}
            onClick={() => setDetailOpen(true)}
          >
            <Info className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            title={t('viewDocument')}
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
          >
            {downloadMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
          </Button>

          {!isTagged && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 text-xs text-primary hover:text-primary gap-1"
              onClick={() => onConfirm(suggestion.document_id)}
            >
              {t('confirmSelection')}
            </Button>
          )}
        </div>
      </div>

      <NormativeDetailModal
        suggestion={suggestion}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
