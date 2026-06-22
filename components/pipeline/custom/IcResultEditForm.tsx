'use client'

import { BookOpen, Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input, Textarea } from '@/components/ui/input'
import { GenericArrayObjectEditor } from './GenericArrayObjectEditor'
import type { EditFormProps } from './AmberWrapper'

export function IcResultEditForm({ draft, updateField }: EditFormProps) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')

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
    <div className="space-y-2">
      <Input
        value={title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="Título"
        className="text-xs h-7"
        autoFocus
      />
      <Textarea
        value={description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Descripción"
        className="text-xs min-h-[60px]"
      />
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
      <GenericArrayObjectEditor
        label={t('components')}
        items={components}
        onChange={(updated) => updateField('components', updated)}
      />
    </div>
  )
}