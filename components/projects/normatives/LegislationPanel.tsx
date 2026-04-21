'use client'

import { Check, HelpCircle, X, Minus, PanelRightClose, PanelRightOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EvaluatedLegislation, LegislationStatus } from '@/lib/nlf-decision-tree'
import type { NormativeDocument } from '@/types'

// Extended type matching the JSON structure (code + ref fields)
interface LegislationData extends EvaluatedLegislation {
  code: string
  ref: string
}

interface LegislationPanelProps {
  evaluated: LegislationData[]
  projectNormatives: NormativeDocument[]
  onAdd: (code: string, ref: string, name: string) => void
  collapsed: boolean
  onToggle: () => void
}

const STATUS_ORDER: LegislationStatus[] = ['confirmed', 'possible', 'excluded', 'not_evaluated']

const STATUS_LABELS: Record<LegislationStatus, string> = {
  confirmed: 'Confirmadas',
  possible: 'Posibles',
  excluded: 'Excluidas',
  not_evaluated: 'Sin evaluar',
}

const STATUS_ICON: Record<LegislationStatus, React.ReactNode> = {
  confirmed: <Check className="h-3 w-3 text-success" />,
  possible: <HelpCircle className="h-3 w-3 text-warning" />,
  excluded: <X className="h-3 w-3 text-destructive" />,
  not_evaluated: <Minus className="h-3 w-3 text-muted-foreground" />,
}

const STATUS_BADGE: Record<LegislationStatus, string> = {
  confirmed: 'bg-success/15 text-success border-success/30',
  possible: 'bg-warning/15 text-warning border-warning/30',
  excluded: 'bg-destructive/10 text-destructive border-destructive/20',
  not_evaluated: 'bg-muted text-muted-foreground border-border',
}

function LegislationRow({
  leg,
  isAdded,
  onAdd,
}: {
  leg: LegislationData
  isAdded: boolean
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/40 group">
      <div className="shrink-0">{STATUS_ICON[leg.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-semibold text-foreground">{leg.code}</span>
          <span className="text-[10px] text-muted-foreground">{leg.ref}</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight truncate">{leg.name}</p>
      </div>
      {leg.status === 'confirmed' && (
        <div className="shrink-0">
          {isAdded ? (
            <span className="text-[10px] text-success flex items-center gap-0.5">
              <Check className="h-3 w-3" />
              Añadida
            </span>
          ) : (
            <button
              onClick={onAdd}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
              title="Añadir a normativas del proyecto"
            >
              <Plus className="h-3 w-3" />
              Añadir
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function LegislationPanel({
  evaluated,
  projectNormatives,
  onAdd,
  collapsed,
  onToggle,
}: LegislationPanelProps) {
  const counts = {
    confirmed: evaluated.filter((l) => l.status === 'confirmed').length,
    possible: evaluated.filter((l) => l.status === 'possible').length,
    excluded: evaluated.filter((l) => l.status === 'excluded').length,
    not_evaluated: evaluated.filter((l) => l.status === 'not_evaluated').length,
  }

  // Match confirmed legislations to existing project normatives by standard_code
  const addedCodes = new Set(
    projectNormatives
      .map((n) => n.metadata?.standard_code)
      .filter(Boolean) as string[]
  )

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2 gap-2 h-full">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          onClick={onToggle}
          title="Expandir legislaciones"
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
        </Button>

        <div className="flex flex-col items-center gap-1.5 text-[10px] font-mono">
          <span className="text-success" title="Confirmadas">✓ {counts.confirmed}</span>
          <span className="text-warning" title="Posibles">? {counts.possible}</span>
          <span className="text-destructive" title="Excluidas">✗ {counts.excluded}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Legislación detectada
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onToggle}
          title="Colapsar"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border shrink-0 flex-wrap">
        {STATUS_ORDER.filter((s) => counts[s] > 0).map((status) => (
          <span
            key={status}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium',
              STATUS_BADGE[status]
            )}
          >
            {STATUS_ICON[status]}
            {counts[status]}
          </span>
        ))}
      </div>

      {/* Legislation list grouped by status */}
      <div className="flex-1 overflow-y-auto">
        {STATUS_ORDER.map((status) => {
          const items = evaluated.filter((l) => l.status === status)
          if (items.length === 0) return null
          return (
            <div key={status}>
              <p className="px-3 pt-3 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {STATUS_LABELS[status]} ({items.length})
              </p>
              <div className="px-1">
                {items.map((leg) => (
                  <LegislationRow
                    key={leg.id}
                    leg={leg}
                    isAdded={addedCodes.has(leg.code)}
                    onAdd={() => onAdd(leg.code, leg.ref, leg.name)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {evaluated.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
            <p className="text-xs">Responde las preguntas para ver qué normativas aplican.</p>
          </div>
        )}
      </div>
    </div>
  )
}
