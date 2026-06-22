'use client'

import { BookOpen, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input, Textarea } from '@/components/ui/input'
import type { EditFormProps } from './AmberWrapper'
import type { ResearchSolution } from '@/types'

export function ResearchSolutionEditForm({ draft, updateField }: EditFormProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
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
    <div className="space-y-2">
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
  )
}