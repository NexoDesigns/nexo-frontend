'use client'

import { useRef } from 'react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useEditState } from './useEditState'
import type { CustomOutputItem } from '@/types'

export interface EditFormProps {
  draft: Record<string, unknown>
  updateField: (key: string, value: unknown) => void
  setDraft: (d: Record<string, unknown>) => void
}

interface AmberWrapperProps {
  item: CustomOutputItem
  onSave: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => void
  /** Renders the edit form when the pencil button is clicked */
  renderEditForm: (props: EditFormProps) => React.ReactNode
  /** The original card, rendered identically to all other items in idle mode */
  children: React.ReactNode
  className?: string
}

export function AmberWrapper({
  item,
  onSave,
  onDelete,
  renderEditForm,
  children,
  className,
}: AmberWrapperProps) {
  const t = useTranslations('pipeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const { draft, isEditing, isSaving, startEdit, updateField, setDraft } = useEditState(
    item.data,
    onSave,
    containerRef as React.RefObject<HTMLElement>
  )

  return (
    <div ref={containerRef} className={cn('border-l-[3px] border-l-amber-400/70 flex flex-col', className)}>
      {/* Amber indicator strip */}
      <div className="flex items-center justify-between gap-2 px-2 py-0.5 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 shrink-0">
            {t('customOutputBadge')}
          </span>
          <span className="text-[10px] text-muted-foreground/50 truncate">
            {item.source_item_label}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); startEdit() }}
              className={cn(
                'p-0.5 rounded text-muted-foreground/40 hover:text-foreground transition-colors',
                isEditing && 'text-primary'
              )}
              title={t('editCustomOutput')}
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {!isSaving && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
              title={t('deleteCustomOutput')}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Idle: original card unchanged. Edit: form panel */}
      {isEditing ? (
        <div
          className="rounded-md border border-amber-400/30 bg-card p-3 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {renderEditForm({ draft, updateField, setDraft })}
          <p className="text-[10px] text-muted-foreground/50 italic">{t('clickOutsideToSave')}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}