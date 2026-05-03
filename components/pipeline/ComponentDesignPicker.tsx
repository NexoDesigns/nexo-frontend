'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COMPONENT_DESIGN_PICKER_MAX_VISIBLE_PARTS } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComponentDesignPickerProps {
  /** output_payload of the active ic_naming_agent run */
  icNamingOutput: Record<string, unknown> | null | undefined
  selectedDesignId: string | null
  onSelect: (designId: string) => void
}

interface DesignOption {
  /** The full key from ic_naming output, e.g. "designA" */
  key: string
  /** Short label, e.g. "A" */
  label: string
  /** List of MPNs (raw, may include suffixes like " (D)") */
  parts: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extracts design letter from key: "designA" → "A", "designBC" → "BC" */
function designLabel(key: string): string {
  return key.replace(/^design/i, '') || key
}

function parseDesigns(output: Record<string, unknown> | null | undefined): DesignOption[] {
  if (!output) return []
  return Object.entries(output)
    .filter(([, v]) => Array.isArray(v) && (v as unknown[]).length > 0)
    .map(([key, parts]) => ({
      key,
      label: designLabel(key),
      parts: (parts as string[]),
    }))
}

// ─── DesignCard ───────────────────────────────────────────────────────────────

function DesignCard({
  design,
  isSelected,
  isSingle,
  onClick,
}: {
  design: DesignOption
  isSelected: boolean
  isSingle: boolean
  onClick: () => void
}) {
  const tCommon = useTranslations('common')
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? design.parts : design.parts.slice(0, COMPONENT_DESIGN_PICKER_MAX_VISIBLE_PARTS)
  const hiddenCount = design.parts.length - COMPONENT_DESIGN_PICKER_MAX_VISIBLE_PARTS

  return (
    <div
      role={isSingle ? undefined : 'button'}
      tabIndex={isSingle ? undefined : 0}
      onClick={isSingle ? undefined : onClick}
      onKeyDown={
        isSingle
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
      }
      className={cn(
        'flex-1 min-w-[160px] max-w-[360px] rounded-md border p-3 transition-colors',
        isSingle
          ? 'border-primary bg-primary/5 cursor-default'
          : isSelected
          ? 'border-primary bg-primary/5 cursor-pointer'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={cn(
            'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {design.label}
        </span>
        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
      </div>

      {/* Part numbers */}
      <div className="space-y-1">
        {visible.map((part, i) => (
          <p key={i} className="text-[11px] font-mono text-foreground truncate">
            {part}
          </p>
        ))}
      </div>

      {/* Show more / less toggle */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className="mt-1.5 flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-2.5 w-2.5" />
              {tCommon('showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-2.5 w-2.5" />
              +{hiddenCount} {tCommon('more')}
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ─── ComponentDesignPicker ────────────────────────────────────────────────────

export function ComponentDesignPicker({
  icNamingOutput,
  selectedDesignId,
  onSelect,
}: ComponentDesignPickerProps) {
  const t = useTranslations('pipeline')
  const designs = parseDesigns(icNamingOutput as Record<string, unknown> | null | undefined)
  const isSingle = designs.length === 1

  // Auto-select when there is exactly one design
  useEffect(() => {
    if (isSingle && !selectedDesignId) {
      onSelect(designs[0].label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSingle, designs[0]?.key])

  if (designs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('componentDesignNoData')}
      </p>
    )
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {t('componentDesignTitle')}
      </p>
      {isSingle && (
        <p className="text-[10px] text-muted-foreground/70 italic mb-2">
          {t('componentDesignSingle')}
        </p>
      )}
      <div className="flex gap-2 flex-wrap">
        {designs.map((design) => (
          <DesignCard
            key={design.key}
            design={design}
            isSelected={selectedDesignId === design.label}
            isSingle={isSingle}
            onClick={() => onSelect(design.label)}
          />
        ))}
      </div>
    </div>
  )
}
