'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IcComponent {
  ic_part_number: string
  manufacturer: string
  ic_type: string
  functional_block?: string
  description: string
  selection_rationale: string
}

interface IcResult {
  id: string
  title: string
  design: string
  description: string
  key_references: string | string[]
  components: IcComponent[]
}

interface IcSelectionOutput {
  results: IcResult[]
  total_designs?: number
  total_components?: number
  error?: string | null
}

function isIcSelectionOutput(v: unknown): v is IcSelectionOutput {
  return (
    typeof v === 'object' &&
    v !== null &&
    'results' in v &&
    Array.isArray((v as IcSelectionOutput).results)
  )
}

// ─── ComponentRow ─────────────────────────────────────────────────────────────

function ComponentRow({ component }: { component: IcComponent }) {
  const tCommon = useTranslations('common')
  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-foreground">
          {component.ic_type}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {component.manufacturer}
        </span>
      </div>
      <p className="text-[11px] text-primary mt-0.5">{component.ic_part_number}</p>
      {component.functional_block && (
        <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
          {component.functional_block}
        </p>
      )}
      <div className="mt-1.5">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {tCommon('description')}{': '}{component.description}
        </p>
      </div>
      <div className="mt-1.5">
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          {tCommon('rationale')}{': '}{component.selection_rationale}
        </p>
      </div>
    </div>
  )
}

// ─── DesignCard ───────────────────────────────────────────────────────────────

function DesignCard({ result }: { result: IcResult }) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const [cardExpanded, setCardExpanded] = useState(false)
  const [componentsExpanded, setComponentsExpanded] = useState(false)

  const references = Array.isArray(result.key_references)
    ? result.key_references.join(', ')
    : result.key_references

  return (
    <div className="rounded-md border border-border bg-card">
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-primary/10 text-primary">
            {result.id}
          </span>
          <p className="text-xs font-medium text-foreground leading-snug">{result.title}</p>
        </div>
        <button
          type="button"
          onClick={() => setCardExpanded((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        >
          {cardExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Description */}
      <div className="px-3 pb-2">
        <p
          className={cn(
            'text-[11px] text-muted-foreground leading-relaxed',
            !cardExpanded && 'line-clamp-2'
          )}
        >
          {result.description}
        </p>
      </div>

      {/* References — only when card expanded */}
      {cardExpanded && references && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            <span className="font-medium not-italic">{tCommon('references')}: </span>
            {references}
          </p>
        </div>
      )}

      {/* Components section */}
      <div className="border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={() => setComponentsExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-left"
        >
          {componentsExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="text-[11px] font-medium text-muted-foreground">
            {result.components.length} {t('components')}
          </span>
        </button>

        {componentsExpanded && (
          <div className="mt-2 overflow-y-auto max-h-[260px] animate-fade-in">
            {result.components.map((c) => (
              <ComponentRow key={c.ic_type} component={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── IcSelectionOutputViewer ──────────────────────────────────────────────────

interface IcSelectionOutputViewerProps {
  output: Record<string, unknown> | null
}

export function IcSelectionOutputViewer({ output }: IcSelectionOutputViewerProps) {
  const t = useTranslations('pipeline')
  const [sectionExpanded, setSectionExpanded] = useState(true)

  if (!output || !isIcSelectionOutput(output)) return null

  const results = output.results.filter((r) => r.components.length > 0)

  return (
    <div>
      <button
        type="button"
        onClick={() => setSectionExpanded((v) => !v)}
        className="flex items-center gap-2 cursor-pointer mb-2"
      >
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {t('icOutputTitle')}
        </p>
        {!sectionExpanded && results.length > 0 && (
          <span className="text-[10px] text-primary font-medium">
            {results.map((r) => r.id).join(', ')}
          </span>
        )}
        {sectionExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {sectionExpanded && (
        <div className="space-y-2 animate-fade-in">
          {results.map((result) => (
            <DesignCard key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}
