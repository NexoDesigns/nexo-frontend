'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/input'
import { CustomItemBadge } from './CustomItemBadge'
import { useEditState } from './useEditState'
import type { CustomOutputItem } from '@/types'

interface Props {
  item: CustomOutputItem
  onSave: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => void
}

export function EditableNetlistOutputCard({ item, onSave, onDelete }: Props) {
  const t = useTranslations('pipeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const { draft, isEditing, isSaving, startEdit, setDraft } = useEditState(
    item.data,
    onSave,
    containerRef as React.RefObject<HTMLElement>
  )

  const jsonText = JSON.stringify(draft, null, 2)

  const handleJsonChange = (val: string) => {
    try {
      const parsed = JSON.parse(val)
      setDraft(parsed as Record<string, unknown>)
    } catch {
      // Keep previous draft if invalid JSON — user is still typing
    }
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
        <div onClick={(e) => e.stopPropagation()}>
          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="text-[11px] font-mono min-h-[120px] resize-y"
            autoFocus
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1 italic">
            JSON · {t('clickOutsideToSave')}
          </p>
        </div>
      ) : (
        <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
          {jsonText}
        </pre>
      )}
    </div>
  )
}
