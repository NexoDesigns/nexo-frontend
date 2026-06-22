'use client'

import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { CustomItemBadge } from './CustomItemBadge'
import { useEditState } from './useEditState'
import type { CustomOutputItem } from '@/types'

interface Props {
  item: CustomOutputItem
  onSave: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => void
}

export function EditableComponentCard({ item, onSave, onDelete }: Props) {
  const t = useTranslations('pipeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const { draft, isEditing, isSaving, startEdit, updateField, setDraft } = useEditState(
    item.data,
    onSave,
    containerRef as React.RefObject<HTMLElement>
  )

  const ref = (draft.ref as string) ?? ''
  const partNumber = (draft.partNumber as string) ?? ''

  // Extra fields: everything except 'ref' and 'partNumber'
  const extraEntries = Object.entries(draft).filter(
    ([k]) => k !== 'ref' && k !== 'partNumber'
  ) as [string, string][]

  const updateExtra = (i: number, key: string, val: string) => {
    const entries = [...extraEntries]
    const oldKey = entries[i][0]
    const newDraft = { ...draft }
    if (key !== oldKey) delete newDraft[oldKey]
    newDraft[key] = val
    setDraft(newDraft)
  }

  const addExtra = () => {
    setDraft({ ...draft, '': '' })
  }

  const removeExtra = (key: string) => {
    const newDraft = { ...draft }
    delete newDraft[key]
    setDraft(newDraft)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-md border p-3 transition-colors',
        'border-l-[3px] border-l-amber-400/70',
        isEditing ? 'border-amber-400/50 bg-card' : 'border-border bg-card'
      )}
    >
      <CustomItemBadge
        sourceLabel={item.source_item_label}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={startEdit}
        onDelete={onDelete}
      />

      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Ref</p>
              <Input
                value={ref}
                onChange={(e) => updateField('ref', e.target.value)}
                placeholder="Ref"
                className="text-[11px] h-6 font-mono"
                autoFocus
              />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Part Number</p>
              <Input
                value={partNumber}
                onChange={(e) => updateField('partNumber', e.target.value)}
                placeholder="MPN"
                className="text-[11px] h-6 font-mono"
              />
            </div>
          </div>
          {extraEntries.map(([k, v], i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                value={k}
                onChange={(e) => updateExtra(i, e.target.value, v)}
                placeholder="Campo"
                className="text-[11px] h-6 w-28"
              />
              <span className="text-muted-foreground/50 text-xs">:</span>
              <Input
                value={v}
                onChange={(e) => updateExtra(i, k, e.target.value)}
                placeholder="Valor"
                className="text-[11px] h-6 flex-1"
              />
              <button type="button" onClick={() => removeExtra(k)}
                className="shrink-0 text-muted-foreground/50 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addExtra}
            className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors">
            <Plus className="h-2.5 w-2.5" /> {t('addField')}
          </button>
          <p className="text-[10px] text-muted-foreground/50 italic">{t('clickOutsideToSave')}</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">Ref</span>
            <span className="text-[11px] font-mono text-foreground">{ref}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">PN</span>
            <span className="text-[11px] font-mono text-foreground">{partNumber}</span>
          </div>
          {extraEntries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0 truncate">{k}</span>
              <span className="text-[11px] text-foreground truncate">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
