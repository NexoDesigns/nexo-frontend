'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, BookOpen, CheckCircle2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimpleContextMenu } from '@/components/ui/context-menu'
import { AmberWrapper } from './custom/AmberWrapper'
import { ResearchSolutionEditForm } from './custom/ResearchSolutionEditForm'
import type { ResearchSolution, ResearchOutputItem, CustomOutputItem } from '@/types'

interface ResearchDesignPickerProps {
  output: Record<string, unknown> | null
  selectedSolutions: ResearchSolution[]
  onToggle: (solution: ResearchSolution) => void
  customItems?: CustomOutputItem[]
  onDuplicate?: (solution: ResearchSolution) => void
  onUpdateCustom?: (itemId: string, data: Record<string, unknown>) => Promise<void>
  onDeleteCustom?: (itemId: string) => void
}

function isUrl(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://')
}

function formatUrl(url: string): string {
  try {
    const { hostname, pathname, search } = new URL(url)
    const path = pathname + search
    return hostname + (path.length > 30 ? path.slice(0, 30) + '…' : path)
  } catch {
    return url
  }
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

  if (isResearchItem(raw)) return [raw]
  if (Array.isArray(raw)) return extractFromArray(raw)

  for (const value of Object.values(payload)) {
    if (isResearchItem(value)) return [value]
    if (Array.isArray(value)) {
      const result = extractFromArray(value)
      if (result) return result
    }
  }

  return null
}

// ─── Single original solution card with context menu ─────────────────────────

function SolutionCard({
  solution,
  isSelected,
  onToggle,
  onDuplicate,
}: {
  solution: ResearchSolution
  isSelected: boolean
  onToggle: () => void
  onDuplicate?: () => void
}) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        onContextMenu={(e) => {
          if (!onDuplicate) return
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
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
        <p className="text-xs font-medium text-foreground mb-1">{solution.title}</p>
        <p className="text-[11px] text-muted-foreground mb-2">{solution.description}</p>
        {solution.key_references.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mb-0.5">
              <BookOpen className="h-2.5 w-2.5" />
              <span>{tCommon('references')}</span>
            </div>
            {solution.key_references.map((ref, i) =>
              isUrl(ref) ? (
                <a
                  key={i}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-primary/70 hover:text-primary hover:underline block pl-3.5 truncate"
                >
                  {formatUrl(ref)}
                </a>
              ) : (
                <p key={i} className="text-[10px] text-muted-foreground/60 pl-3.5">
                  {ref}
                </p>
              )
            )}
          </div>
        )}
      </button>
      <SimpleContextMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={onDuplicate ? [{ label: t('duplicateOutput'), icon: Copy, onSelect: onDuplicate }] : []}
        onClose={() => setMenu(null)}
      />
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResearchDesignPicker({
  output,
  selectedSolutions,
  onToggle,
  customItems = [],
  onDuplicate,
  onUpdateCustom,
  onDeleteCustom,
}: ResearchDesignPickerProps) {
  const t = useTranslations('pipeline')
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
                <SolutionCard
                  key={solution.id}
                  solution={solution}
                  isSelected={isSelected}
                  onToggle={() => onToggle(solution)}
                  onDuplicate={onDuplicate ? () => onDuplicate(solution) : undefined}
                />
              )
            })}

            {/* Custom (duplicated + edited) items — identical look via AmberWrapper + original SolutionCard */}
            {customItems.map((ci) => {
              const ciSolution = ci.data as unknown as ResearchSolution
              const isSelected = selectedSolutions.some((s) => s.id === ciSolution.id)
              return (
                <AmberWrapper
                  key={ci.id}
                  item={ci}
                  className="flex-1 min-w-[180px] max-w-[400px]"
                  onSave={(data: Record<string, unknown>) => onUpdateCustom?.(ci.id, data) ?? Promise.resolve()}
                  onDelete={() => onDeleteCustom?.(ci.id)}
                  renderEditForm={(props) => <ResearchSolutionEditForm {...props} />}
                >
                  <SolutionCard
                    solution={ciSolution}
                    isSelected={isSelected}
                    onToggle={() => onToggle(ciSolution)}
                  />
                </AmberWrapper>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
