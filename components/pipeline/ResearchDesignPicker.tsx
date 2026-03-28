'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResearchSolution, ResearchOutputItem } from '@/types'

interface ResearchDesignPickerProps {
  output: Record<string, unknown> | null
  selectedSolutions: ResearchSolution[]
  onToggle: (solution: ResearchSolution) => void
}

function isResearchItem(item: unknown): item is ResearchOutputItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'solutions' in item &&
    Array.isArray((item as Record<string, unknown>).solutions)
  )
}

function extractFromArray(arr: unknown[]): ResearchOutputItem[] | null {
  // Direct: [{query_summary, solutions, error}]
  const direct = arr.filter(isResearchItem)
  if (direct.length > 0) return direct

  // n8n wrapper: [{json: {query_summary, solutions, error}}]
  const unwrapped = arr
    .filter((item) => typeof item === 'object' && item !== null && 'json' in item)
    .map((item) => (item as Record<string, unknown>).json)
    .filter(isResearchItem)
  if (unwrapped.length > 0) return unwrapped

  return null
}

function parseResearchOutput(
  payload: Record<string, unknown> | null
): ResearchOutputItem[] | null {
  if (!payload) return null
  const raw = payload as unknown

  // Case 1: payload is directly a ResearchOutputItem object
  if (isResearchItem(raw)) return [raw]

  // Case 2: payload is an array
  if (Array.isArray(raw)) return extractFromArray(raw)

  // Case 3: payload is an object — search top-level values for arrays or items
  for (const value of Object.values(payload)) {
    if (isResearchItem(value)) return [value]
    if (Array.isArray(value)) {
      const result = extractFromArray(value)
      if (result) return result
    }
  }

  return null
}

export function ResearchDesignPicker({
  output,
  selectedSolutions,
  onToggle,
}: ResearchDesignPickerProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const outputItems = parseResearchOutput(output)

  if (!outputItems || outputItems.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">{t('noDesignsInOutput')}</p>
    )
  }

  return (
    <div className="space-y-3">
      {outputItems.map((item, idx) => (
        <div key={idx}>
          {item.error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive mb-3">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="font-mono">{item.error}</span>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {item.solutions.map((solution) => {
              const isSelected = selectedSolutions.some((s) => s.id === solution.id)
              return (
                <button
                  key={solution.id}
                  type="button"
                  onClick={() => onToggle(solution)}
                  className={cn(
                    'flex-1 min-w-[180px] max-w-[400px] rounded-md border p-3 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {solution.id}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    {solution.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {solution.description}
                  </p>
                  {solution.key_references.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mb-0.5">
                        <BookOpen className="h-2.5 w-2.5" />
                        <span>{tCommon('references')}</span>
                      </div>
                      {solution.key_references.map((ref, i) => (
                        <p
                          key={i}
                          className="text-[10px] text-muted-foreground/60 pl-3.5"
                        >
                          {ref}
                        </p>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
