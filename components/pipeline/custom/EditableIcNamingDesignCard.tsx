'use client'

import { useRef } from 'react'
import { CheckCircle2, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { CustomItemBadge } from './CustomItemBadge'
import { useEditState } from './useEditState'
import type { CustomOutputItem } from '@/types'

interface Props {
  item: CustomOutputItem
  isSelected: boolean
  onSelect: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => void
}

export function EditableIcNamingDesignCard({ item, isSelected, onSelect, onSave, onDelete }: Props) {
  const t = useTranslations('pipeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, draft, isEditing, isSaving, startEdit, updateField } = useEditState(
    item.data,
    onSave,
    containerRef as React.RefObject<HTMLElement>
  )

  const label = (draft.label as string) ?? item.source_item_label
  const parts: string[] = Array.isArray(draft.parts) ? (draft.parts as string[]) : []

  const updatePart = (i: number, val: string) => {
    const next = [...parts]
    next[i] = val
    updateField('parts', next)
  }
  const addPart = () => updateField('parts', [...parts, ''])
  const removePart = (i: number) => updateField('parts', parts.filter((_, idx) => idx !== i))

  return (
    <div
      ref={containerRef}
      onClick={() => { if (!isEditing) onSelect() }}
      className={cn(
        'flex-1 min-w-[160px] max-w-[360px] rounded-md border p-3 transition-colors',
        'border-l-[3px] border-l-amber-400/70',
        isEditing
          ? 'border-amber-400/50 bg-card cursor-default'
          : isSelected
          ? 'border-primary bg-primary/5 cursor-pointer'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <CustomItemBadge
        sourceLabel={item.source_item_label}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={startEdit}
        onDelete={onDelete}
      />

      {/* Design label badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn(
          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {label}
        </span>
        {isSelected && !isEditing && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
      </div>

      {isEditing ? (
        <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
          {parts.map((part, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                value={part}
                onChange={(e) => updatePart(i, e.target.value)}
                placeholder="Part number"
                className="text-[11px] h-6 font-mono flex-1"
                autoFocus={i === 0}
              />
              <button
                type="button"
                onClick={() => removePart(i)}
                className="shrink-0 text-muted-foreground/50 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPart}
            className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors mt-1"
          >
            <Plus className="h-2.5 w-2.5" /> {t('addPart')}
          </button>
          <p className="text-[10px] text-muted-foreground/50 mt-1 italic">
            {t('clickOutsideToSave')}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {parts.map((part, i) => (
            <p key={i} className="text-[11px] font-mono text-foreground truncate">{part}</p>
          ))}
        </div>
      )}
    </div>
  )
}
