'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { componentsApi } from '@/lib/api'
import type { IcAvailabilityResult, PartAvailabilityInfo } from '@/types'

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

function formatPrice(info: PartAvailabilityInfo): string {
  if (!info.unit_price) return ''
  const symbol = info.currency === 'EUR' ? '€' : (info.currency ?? '')
  return `${symbol}${parseFloat(info.unit_price).toFixed(2)}`
}

// ─── Availability badge ───────────────────────────────────────────────────────

function AvailabilityBadge({ info }: { info: PartAvailabilityInfo }) {
  if (!info.available) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">
        No stock
      </span>
    )
  }

  const price = formatPrice(info)

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        {info.supplier ?? 'In stock'}
      </span>
      {price && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {price}
        </span>
      )}
    </span>
  )
}

// ─── IcNamingOutputViewer ─────────────────────────────────────────────────────

interface IcNamingOutputViewerProps {
  output: Record<string, unknown> | null
}

export function IcNamingOutputViewer({ output }: IcNamingOutputViewerProps) {
  const t = useTranslations('pipeline')
  const [sectionExpanded, setSectionExpanded] = useState(true)
  const [availability, setAvailability] = useState<IcAvailabilityResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  if (!output || !isIcNamingOutput(output)) return null

  // Only designs with at least one part number
  const designs = Object.entries(output).filter(([, parts]) => parts.length > 0)

  if (designs.length === 0) return null

  async function handleCheckAvailability() {
    setChecking(true)
    setCheckError(null)
    try {
      const result = await componentsApi.checkIcAvailability(output as Record<string, string[]>)
      setAvailability(result)
      console.log(result);
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : 'Error checking availability')
    } finally {
      setChecking(false)
    }
  }

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
        <div className="animate-fade-in space-y-2">
          {/* Availability check button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={checking}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {checking && <Loader2 className="h-3 w-3 animate-spin" />}
              {checking ? 'Checking...' : availability ? 'Refresh availability' : 'Check availability'}
            </button>
            {checkError && (
              <span className="text-[10px] text-destructive">{checkError}</span>
            )}
          </div>

          {/* Design cards */}
          <div className="flex gap-2 items-start">
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
                <div className="space-y-1.5">
                  {parts.map((raw, i) => {
                    const { base, suffix } = parsePart(raw)
                    const info = availability?.parts[base]
                    return (
                      <div key={i} className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        <span className="text-foreground">{base}</span>
                        {suffix && (
                          <span className="text-destructive">({suffix})</span>
                        )}
                        {info && <AvailabilityBadge info={info} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
