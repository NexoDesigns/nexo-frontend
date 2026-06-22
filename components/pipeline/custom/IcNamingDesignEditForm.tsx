'use client'

import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import type { EditFormProps } from './AmberWrapper'

export function IcNamingDesignEditForm({ draft, updateField }: EditFormProps) {
  const t = useTranslations('pipeline')
  const parts: string[] = Array.isArray(draft.parts) ? (draft.parts as string[]) : []

  const updatePart = (i: number, val: string) => {
    const next = [...parts]
    next[i] = val
    updateField('parts', next)
  }
  const addPart = () => updateField('parts', [...parts, ''])
  const removePart = (i: number) =>
    updateField('parts', parts.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-1">
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
    </div>
  )
}