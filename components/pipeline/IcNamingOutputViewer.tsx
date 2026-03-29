'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IcNamingOutput {
  [designKey: string]: string[]
}

function isIcNamingOutput(v: unknown): v is IcNamingOutput {
  return (
    typeof v === 'object' &&
    v !== null &&
    Object.values(v as object).every(Array.isArray)
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parses "LM5176" → { base: "LM5176", suffix: null }
 *  Parses "CSD87350Q5 (D)" → { base: "CSD87350Q5", suffix: "D" } */
function parsePart(raw: string): { base: string; suffix: string | null } {
  const match = raw.match(/^(.+?)\s+\((.+)\)$/)
  if (match) return { base: match[1], suffix: match[2] }
  return { base: raw, suffix: null }
}

/** Extracts design letter from key: "designA" → "A", "designBC" → "BC" */
function designLabel(key: string): string {
  return key.replace(/^design/i, '') || key
}

// ─── IcNamingOutputViewer ─────────────────────────────────────────────────────

interface IcNamingOutputViewerProps {
  output: Record<string, unknown> | null
}

export function IcNamingOutputViewer({ output }: IcNamingOutputViewerProps) {
  const t = useTranslations('pipeline')
  const [sectionExpanded, setSectionExpanded] = useState(true)

  if (!output || !isIcNamingOutput(output)) return null

  // Only designs with at least one part number
  const designs = Object.entries(output).filter(([, parts]) => parts.length > 0)

  if (designs.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setSectionExpanded((v) => !v)}
        className="flex items-center gap-2 cursor-pointer mb-2"
      >
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {t('output')}
        </p>
        {!sectionExpanded && (
          <span className="text-[10px] text-primary font-medium">
            {designs.map(([key]) => designLabel(key)).join(', ')}
          </span>
        )}
        {sectionExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {sectionExpanded && (
        <div className="flex gap-2 items-start animate-fade-in">
          {designs.map(([key, parts]) => (
            <div key={key} className="flex-1 min-w-0 rounded-md border border-border bg-card px-3 py-2.5">
              {/* Design header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold bg-primary/10 text-primary">
                  {designLabel(key)}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {parts.length} {t('components')}
                </span>
              </div>

              {/* Part numbers */}
              <div className="space-y-1">
                {parts.map((raw, i) => {
                  const { base, suffix } = parsePart(raw)
                  return (
                    <div key={i} className="flex items-center gap-1 text-xs font-mono">
                      <span className="text-foreground">{base}</span>
                      {suffix && (
                        <span className="text-destructive">({suffix})</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
