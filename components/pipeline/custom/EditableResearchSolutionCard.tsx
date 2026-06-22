'use client'

import { useRef } from 'react'
import { BookOpen, CheckCircle2, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input, Textarea } from '@/components/ui/input'
import { CustomItemBadge } from './CustomItemBadge'
import { useEditState } from './useEditState'
import type { CustomOutputItem, ResearchSolution } from '@/types'

interface Props {
  item: CustomOutputItem
  isSelected: boolean
  onToggle: () => void
  onSave: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => void
}

function isUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

export function EditableResearchSolutionCard({ item, isSelected, onToggle, onSave, onDelete }: Props) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, draft, isEditing, isSaving, startEdit, updateField } = useEditState(
    item.data,
    onSave,
    containerRef as React.RefObject<HTMLElement>
  )

  const solution = draft as unknown as ResearchSolution
  const refs: string[] = Array.isArray(draft.key_references) ? (draft.key_references as string[]) : []

  const updateRef = (i: number, val: string) => {
    const next = [...refs]
    next[i] = val
    updateField('key_references', next)
  }
  const addRef = () => updateField('key_references', [...refs, ''])
  const removeRef = (i: number) => updateField('key_references', refs.filter((_, idx) => idx !== i))

  return (
    <div
      ref={containerRef}
      onClick={() => { if (!isEditing) onToggle() }}
      className={cn(
        'flex-1 min-w-[180px] max-w-[400px] rounded-md border p-3 text-left transition-colors',
        'border-l-[3px] border-l-amber-400/70',
        isEditing
          ? 'border-amber-400/50 bg-card cursor-default'
          : isSelected
          ? 'border-primary bg-primary/5 cursor-pointer'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30 cursor-pointer'
      )}
    >
      <CustomItemBadge
        sourceLabel={item.source_item_label}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={startEdit}
        onDelete={onDelete}
      />

      {/* ID badge + selection check */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className={cn(
          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {solution.id}
        </span>
        {isSelected && !isEditing && (
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <Input
            value={solution.title ?? ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Título"
            className="text-xs h-7"
            autoFocus
          />
          <Textarea
            value={solution.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descripción"
            className="text-xs min-h-[60px]"
          />
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5" /> {tCommon('references')}
            </p>
            {refs.map((ref, i) => (
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
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-foreground mb-1">{solution.title}</p>
          <p className="text-[11px] text-muted-foreground mb-2">{solution.description}</p>
          {refs.length > 0 && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mb-0.5">
                <BookOpen className="h-2.5 w-2.5" />
                <span>{tCommon('references')}</span>
              </div>
              {refs.map((ref, i) =>
                isUrl(ref) ? (
                  <a
                    key={i}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-primary/70 hover:text-primary hover:underline block pl-3.5 truncate"
                  >
                    {ref}
                  </a>
                ) : (
                  <p key={i} className="text-[10px] text-muted-foreground/60 pl-3.5">{ref}</p>
                )
              )}
            </div>
          )}
        </>
      )}

      {state === 'editing' && (
        <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
          {t('clickOutsideToSave')}
        </p>
      )}
    </div>
  )
}
