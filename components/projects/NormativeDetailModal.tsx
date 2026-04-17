'use client'

import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives'
import { Badge } from '@/components/ui/badge'
import type { NormativeSuggestion } from '@/types'

interface NormativeDetailModalProps {
  suggestion: NormativeSuggestion | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NormativeDetailModal({
  suggestion,
  open,
  onOpenChange,
}: NormativeDetailModalProps) {
  const t = useTranslations('normativas')
  const meta = suggestion?.document?.metadata

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            {suggestion?.standard_code ?? '—'}
          </DialogTitle>
        </DialogHeader>

        {meta ? (
          <div className="space-y-4 text-xs">
            <Row label={t('version')} value={meta.standard_version ?? '—'} />
            <Row label={t('issuingBody')} value={meta.issuing_body} />

            <div className="space-y-1.5">
              <span className="text-muted-foreground font-medium">
                {t('applicableIndustries')}
              </span>
              <div className="flex flex-wrap gap-1">
                {meta.applicable_industries.length > 0
                  ? meta.applicable_industries.map((ind) => (
                      <Badge key={ind} variant="muted" className="text-[10px]">
                        {ind.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  : <span className="text-muted-foreground">—</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-muted-foreground font-medium">
                {t('applicableCountries')}
              </span>
              <div className="flex flex-wrap gap-1">
                {meta.applicable_countries.length > 0
                  ? meta.applicable_countries.map((c) => (
                      <Badge key={c} variant="muted" className="text-[10px]">{c}</Badge>
                    ))
                  : <Badge variant="muted" className="text-[10px]">{t('global')}</Badge>}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-muted-foreground font-medium">
                {t('applicableUserTypes')}
              </span>
              <div className="flex flex-wrap gap-1">
                {meta.applicable_user_types.length > 0
                  ? meta.applicable_user_types.map((u) => (
                      <Badge key={u} variant="muted" className="text-[10px]">
                        {u.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  : <span className="text-muted-foreground">—</span>}
              </div>
            </div>

            {meta.scope_summary && (
              <div className="space-y-1.5">
                <span className="text-muted-foreground font-medium">{t('scope')}</span>
                <p className="text-foreground leading-relaxed">{meta.scope_summary}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('noMetadata')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground font-medium w-32 shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
