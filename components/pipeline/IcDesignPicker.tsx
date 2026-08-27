'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IcComponentSummary {
  ic_type: string
  ic_part_number: string
}

interface DesignOption {
  id: string
  title: string
  components: IcComponentSummary[]
}

interface IcSelectionOutput {
  results: DesignOption[]
}

function isIcSelectionOutput(v: unknown): v is IcSelectionOutput {
  return (
    typeof v === 'object' &&
    v !== null &&
    'results' in v &&
    Array.isArray((v as IcSelectionOutput).results)
  )
}

interface IcDesignPickerProps {
  /** output_payload of the active ic_selection run */
  icSelectionOutput: Record<string, unknown> | null | undefined
  selectedDesignId: string | null
  onSelect: (designId: string) => void
}

// ─── IcDesignPicker ───────────────────────────────────────────────────────────

/** Lets the engineer choose which ic_selection design to send to architecture_agent. */
export function IcDesignPicker({ icSelectionOutput, selectedDesignId, onSelect }: IcDesignPickerProps) {
  const t = useTranslations('pipeline')
  const designs = isIcSelectionOutput(icSelectionOutput)
    ? icSelectionOutput.results.filter((r) => r.components.length > 0)
    : []
  const isSingle = designs.length === 1

  // Auto-select when there is exactly one design
  useEffect(() => {
    if (isSingle && !selectedDesignId) {
      onSelect(designs[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSingle, designs[0]?.id])

  if (designs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('icDesignPickerNoData')}
      </p>
    )
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {t('icDesignPickerTitle')}
      </p>
      <div className="flex gap-2 flex-wrap">
        {designs.map((design) => {
          const isSelected = selectedDesignId === design.id
          return (
            <button
              key={design.id}
              type="button"
              onClick={() => onSelect(design.id)}
              disabled={isSingle}
              className={cn(
                'flex-1 min-w-[160px] max-w-[360px] rounded-md border p-3 text-left transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
                isSingle && 'cursor-default',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {design.id}
                </span>
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              <p className="text-[11px] text-foreground font-medium leading-snug mb-1">{design.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {design.components.length} {t('components')}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}