'use client'

import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import type { EditFormProps } from './AmberWrapper'

export function ComponentEditForm({ draft, updateField, setDraft }: EditFormProps) {
  const t = useTranslations('pipeline')
  const ref = (draft.ref as string) ?? ''
  const partNumber = (draft.partNumber as string) ?? ''
  const extraEntries = Object.entries(draft).filter(
    ([k]) => k !== 'ref' && k !== 'partNumber'
  ) as [string, string][]

  const updateExtra = (i: number, key: string, val: string) => {
    const oldKey = extraEntries[i][0]
    const newDraft = { ...draft }
    if (key !== oldKey) delete newDraft[oldKey]
    newDraft[key] = val
    setDraft(newDraft)
  }
  const addExtra = () => setDraft({ ...draft, '': '' })
  const removeExtra = (key: string) => {
    const newDraft = { ...draft }
    delete newDraft[key]
    setDraft(newDraft)
  }

  return (
    <div className="space-y-2">
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
          <button
            type="button"
            onClick={() => removeExtra(k)}
            className="shrink-0 text-muted-foreground/50 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addExtra}
        className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
      >
        <Plus className="h-2.5 w-2.5" /> {t('addField')}
      </button>
    </div>
  )
}