'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimpleContextMenu } from '@/components/ui/context-menu'
import { AmberWrapper } from './custom/AmberWrapper'
import { ComponentEditForm } from './custom/ComponentEditForm'
import type { BomPart, BomResult, CustomOutputItem } from '@/types'

// ─── Component selection output types ────────────────────────────────────────

interface DesignComponent {
  ref: string
  partNumber: string
  [field: string]: string | number | undefined
}

interface ComponentSelectionOutput {
  designcomponents: {
    components: DesignComponent[]
  }
  totalComponents?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STRUCTURAL_FIELDS = new Set(['ref', 'partNumber'])

function parseOutput(output: Record<string, unknown> | null): ComponentSelectionOutput | null {
  if (!output) return null
  const candidate = Array.isArray(output) ? (output as unknown[])[0] : output
  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    'designcomponents' in (candidate as object)
  ) {
    const c = candidate as Record<string, unknown>
    const dc = c.designcomponents as Record<string, unknown> | undefined
    if (dc && Array.isArray(dc.components)) {
      return candidate as ComponentSelectionOutput
    }
  }
  return null
}

function groupByType(components: DesignComponent[]): Record<string, DesignComponent[]> {
  const groups: Record<string, DesignComponent[]> = {}
  for (const comp of components) {
    const key = comp.partNumber ?? 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(comp)
  }
  return groups
}

// ─── ComponentRow ─────────────────────────────────────────────────────────────

function ComponentRow({ component, onDuplicate }: { component: DesignComponent; onDuplicate?: () => void }) {
  const t = useTranslations('pipeline')
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const specs = Object.entries(component).filter(([k]) => !STRUCTURAL_FIELDS.has(k))
  return (
    <>
      <div
        className="py-2 border-b border-border last:border-0"
        onContextMenu={(e) => {
          if (!onDuplicate) return
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
            {component.ref}
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 min-w-0">
            {specs.map(([key, value]) => (
              <span key={key} className="text-[10px] text-muted-foreground">
                <span className="text-muted-foreground/60">{key}:</span>{' '}
                <span className="text-foreground">{String(value ?? '')}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
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

// ─── TypeGroup ────────────────────────────────────────────────────────────────

function TypeGroup({
  type,
  components,
  onDuplicateComponent,
}: {
  type: string
  components: DesignComponent[]
  onDuplicateComponent?: (comp: DesignComponent) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground capitalize">{type}</span>
          <span className="text-[10px] text-muted-foreground">×{components.length}</span>
        </div>
        {open ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3 animate-fade-in">
          {components.map((comp) => (
            <ComponentRow
              key={comp.ref}
              component={comp}
              onDuplicate={onDuplicateComponent ? () => onDuplicateComponent(comp) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BomPartRow ───────────────────────────────────────────────────────────────

function SupplierBadge({ supplier }: { supplier: string }) {
  const isDigikey = supplier.toLowerCase().includes('digikey')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
        isDigikey
          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      )}
    >
      {supplier}
    </span>
  )
}

function BomPartRow({ part }: { part: BomPart }) {
  const label = part.ref ?? part.ManufacturerPartNumber ?? '—'
  const mpn = part.ManufacturerPartNumber
  const priceNum = part.UnitPrice != null ? parseFloat(String(part.UnitPrice)) : null
  const price = priceNum != null && !isNaN(priceNum) ? `$${priceNum.toFixed(4)}` : null
  const stockNum = part.InStock != null ? parseInt(String(part.InStock), 10) : null
  const stock = stockNum != null && !isNaN(stockNum) ? stockNum.toLocaleString() : null

  return (
    <div className="py-2 border-b border-border last:border-0 flex items-center gap-2 flex-wrap">
      {part.ref && (
        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
          {part.ref}
        </span>
      )}
      {mpn && (
        <span className="text-[11px] font-mono text-foreground">{mpn}</span>
      )}
      {part.Supplier && <SupplierBadge supplier={part.Supplier} />}
      {price && (
        <span className="text-[10px] text-muted-foreground font-mono">{price}</span>
      )}
      {stock != null && (
        <span className="text-[10px] text-muted-foreground">
          <span className="text-muted-foreground/60">stock:</span> {stock}
        </span>
      )}
      {part.DatasheetUrl && (
        <a
          href={part.DatasheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary transition-colors"
          title={label}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

// ─── BomSection ───────────────────────────────────────────────────────────────

interface BomSectionProps {
  bomResult: BomResult | null | undefined
  isRecheckPending: boolean
  onRecheck: () => void
}

function BomSection({ bomResult, isRecheckPending, onRecheck }: BomSectionProps) {
  const [unavailableOpen, setUnavailableOpen] = useState(false)

  const availCount = bomResult?.summary.available_count ?? 0
  const totalCount = bomResult?.summary.total_parts ?? 0

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Part Availability (BOM)
        </p>
        {bomResult && (
          <span className="text-[10px] font-medium text-primary">
            {availCount}/{totalCount} available
          </span>
        )}
        <button
          type="button"
          onClick={onRecheck}
          disabled={isRecheckPending}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRecheckPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {isRecheckPending ? 'Checking...' : bomResult ? 'Recheck' : 'Check availability'}
        </button>
      </div>

      {!bomResult ? (
        <p className="text-[11px] text-muted-foreground italic">
          {isRecheckPending ? 'Running BOM check...' : 'No BOM data yet. Click "Check availability" to run.'}
        </p>
      ) : (
        <div className="space-y-2">
          {/* Available parts */}
          {bomResult.available.length > 0 && (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="px-3 py-2 bg-muted/30">
                <span className="text-[11px] font-semibold text-foreground">Available</span>
                <span className="ml-2 text-[10px] text-muted-foreground">×{bomResult.available.length}</span>
              </div>
              <div className="px-3">
                {bomResult.available.map((part, i) => (
                  <BomPartRow key={i} part={part} />
                ))}
              </div>
            </div>
          )}

          {/* Unavailable parts — collapsed by default */}
          {bomResult.unavailable.length > 0 && (
            <div className="rounded-md border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setUnavailableOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-destructive/5 hover:bg-destructive/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-destructive">Not found</span>
                  <span className="text-[10px] text-muted-foreground">×{bomResult.unavailable.length}</span>
                </div>
                {unavailableOpen ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </button>
              {unavailableOpen && (
                <div className="px-3 animate-fade-in">
                  {bomResult.unavailable.map((part, i) => (
                    <BomPartRow key={i} part={part} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ComponentSelectionOutputViewer ──────────────────────────────────────────

interface ComponentSelectionOutputViewerProps {
  output: Record<string, unknown> | null
  bomResult?: BomResult | null
  isRecheckPending?: boolean
  onRecheck?: () => void
  customItems?: CustomOutputItem[]
  onDuplicate?: (component: DesignComponent) => void
  onUpdateCustom?: (itemId: string, data: Record<string, unknown>) => Promise<void>
  onDeleteCustom?: (itemId: string) => void
}

export function ComponentSelectionOutputViewer({
  output,
  bomResult,
  isRecheckPending = false,
  onRecheck = () => {},
  customItems = [],
  onDuplicate,
  onUpdateCustom,
  onDeleteCustom,
}: ComponentSelectionOutputViewerProps) {
  const t = useTranslations('pipeline')
  const [sectionExpanded, setSectionExpanded] = useState(true)

  const parsed = parseOutput(output)
  if (!parsed) return null

  const { components } = parsed.designcomponents
  const groups = groupByType(components)
  const typeKeys = Object.keys(groups)

  return (
    <div className="space-y-4">
      {/* Design components section */}
      <div>
        <button
          type="button"
          onClick={() => setSectionExpanded((v) => !v)}
          className="flex items-center gap-2 cursor-pointer mb-2"
        >
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t('componentSelectionOutputTitle')}
          </p>
          <span
            className={cn(
              'text-[10px] font-medium',
              sectionExpanded ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            {components.length} components
          </span>
          {sectionExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        {sectionExpanded && (
          <div className="space-y-2 animate-fade-in">
            {typeKeys.map((type) => (
              <TypeGroup
                key={type}
                type={type}
                components={groups[type]}
                onDuplicateComponent={onDuplicate}
              />
            ))}

            {/* Custom (duplicated + edited) components — identical look via AmberWrapper + original ComponentRow */}
            {customItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide pt-1">
                  {t('customComponentsSection')}
                </p>
                {customItems.map((ci) => {
                  const ciComponent = ci.data as unknown as DesignComponent
                  return (
                    <AmberWrapper
                      key={ci.id}
                      item={ci}
                      onSave={(data: Record<string, unknown>) => onUpdateCustom?.(ci.id, data) ?? Promise.resolve()}
                      onDelete={() => onDeleteCustom?.(ci.id)}
                      renderEditForm={(props) => <ComponentEditForm {...props} />}
                    >
                      <ComponentRow component={ciComponent} />
                    </AmberWrapper>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOM / availability section */}
      <BomSection
        bomResult={bomResult}
        isRecheckPending={isRecheckPending}
        onRecheck={onRecheck}
      />
    </div>
  )
}
