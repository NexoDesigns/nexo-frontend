'use client'

import { useRef, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input, Textarea } from '@/components/ui/input'
import { CustomItemBadge } from './CustomItemBadge'
import { GenericArrayObjectEditor } from './GenericArrayObjectEditor'
import { useEditState } from './useEditState'
import type { CustomOutputItem } from '@/types'

interface Props {
  item: CustomOutputItem
  onSave: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => void
}

export function EditableIcResultCard({ item, onSave, onDelete }: Props) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const containerRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const { draft, isEditing, isSaving, startEdit, updateField } = useEditState(
    item.data,
    onSave,
    containerRef as React.RefObject<HTMLElement>
  )

  const title = (draft.title as string) ?? ''
  const description = (draft.description as string) ?? ''

  const keyRefs: string[] = Array.isArray(draft.key_references)
    ? (draft.key_references as string[])
    : typeof draft.key_references === 'string' && draft.key_references
    ? [draft.key_references as string]
    : []

  const components: Record<string, unknown>[] = Array.isArray(draft.components)
    ? (draft.components as Record<string, unknown>[])
    : []

  const updateRef = (i: number, val: string) => {
    const next = [...keyRefs]
    next[i] = val
    updateField('key_references', next)
  }
  const addRef = () => updateField('key_references', [...keyRefs, ''])
  const removeRef = (i: number) =>
    updateField('key_references', keyRefs.filter((_, idx) => idx !== i))

  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-md border p-3 text-left transition-colors',
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

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono bg-muted text-muted-foreground">
          {(draft.id as string) ?? ''}
        </span>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground/60 hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Título"
            className="text-xs h-7"
            autoFocus
          />

          {/* Description */}
          <Textarea
            value={description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descripción"
            className="text-xs min-h-[60px]"
          />

          {/* Key references */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5" /> {tCommon('references')}
            </p>
            {keyRefs.map((ref, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input
                  value={ref}
                  onChange={(e) => updateRef(i, e.target.value)}
                  placeholder="URL"
                  className="text-[11px] h-6 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeRef(i)}
                  className="shrink-0 text-muted-foreground/50 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRef}
              className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
            >
              <Plus className="h-2.5 w-2.5" /> {t('addReference')}
            </button>
          </div>

          {/* Components — generic array-of-objects editor */}
          <GenericArrayObjectEditor
            label={t('components')}
            items={components}
            onChange={(updated) => updateField('components', updated)}
          />

          <p className="text-[10px] text-muted-foreground/50 italic">{t('clickOutsideToSave')}</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-foreground mb-1">{title}</p>
          <p className={cn('text-[11px] text-muted-foreground', !expanded && 'line-clamp-2')}>
            {description}
          </p>
          {expanded && keyRefs.length > 0 && (
            <div className="mt-2 space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mb-0.5">
                <BookOpen className="h-2.5 w-2.5" /> {tCommon('references')}
              </div>
              {keyRefs.map((ref, i) => (
                <p key={i} className="text-[10px] text-muted-foreground/60 pl-3.5 truncate">
                  {ref}
                </p>
              ))}
            </div>
          )}
          {expanded && components.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">
                {t('components')} ×{components.length}
              </p>
              {components.map((comp, i) => (
                <div key={i} className="rounded border border-border/40 px-2 py-1 space-y-0.5">
                  {Object.entries(comp).map(([k, v]) => (
                    <p key={k} className="text-[10px] text-muted-foreground truncate">
                      <span className="text-muted-foreground/50">{k}: </span>
                      {String(v ?? '')}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}