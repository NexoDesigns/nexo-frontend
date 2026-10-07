'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RunFinishedNoticeProps {
  runNumber: number
  failed: boolean
  onShow: () => void
  onDismiss: () => void
}

/** Sticky note that a run finished while the user was looking at another one. */
export function RunFinishedNotice({ runNumber, failed, onShow, onDismiss }: RunFinishedNoticeProps) {
  const t = useTranslations('pipeline')
  const Icon = failed ? XCircle : CheckCircle2

  return (
    <div
      role="status"
      className={cn(
        'sticky top-0 z-10 flex items-center gap-3 rounded-md border px-3.5 py-2.5 text-[13px] shadow-[0_8px_24px_rgba(0,0,0,.35)] backdrop-blur',
        failed ? 'border-destructive/40 bg-[#2E2226]/95' : 'border-[#E0894A]/40 bg-[#2B2620]/95'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', failed ? 'text-destructive' : 'text-[#E0894A]')} />
      <span className="min-w-0 flex-1 text-foreground">
        {failed ? t('runFailedNotice', { number: runNumber }) : t('runFinishedNotice', { number: runNumber })}
      </span>
      <button
        type="button"
        onClick={onShow}
        className="h-7 shrink-0 rounded-[5px] border border-border px-3 text-[12.5px] text-foreground transition-colors hover:border-primary"
      >
        {t('show')}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        title={t('dismiss')}
        aria-label={t('dismiss')}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
