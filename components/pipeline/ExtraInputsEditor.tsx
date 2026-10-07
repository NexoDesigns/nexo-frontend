'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

export interface KeyValuePair {
  key: string
  value: string
}

/** Rows for an inputs object (values that aren't strings are shown as JSON). */
export function pairsFromInputs(inputs: Record<string, unknown> = {}): KeyValuePair[] {
  const entries = Object.entries(inputs)
  if (entries.length === 0) return [{ key: '', value: '' }]
  return entries.map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }))
}

/** The inputs object for the rows: empty keys are skipped, JSON values parsed. */
export function inputsFromPairs(pairs: KeyValuePair[]): Record<string, unknown> {
  const inputs: Record<string, unknown> = {}
  pairs.forEach(({ key, value }) => {
    if (key.trim()) {
      try {
        inputs[key.trim()] = JSON.parse(value)
      } catch {
        inputs[key.trim()] = value
      }
    }
  })
  return inputs
}

/** Free key/value extra inputs for a phase workflow (power-user feature). */
export function ExtraInputsEditor({
  pairs,
  onChange,
}: {
  pairs: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
}) {
  const t = useTranslations('pipeline')

  const updatePair = (index: number, field: 'key' | 'value', val: string) =>
    onChange(pairs.map((p, i) => (i === index ? { ...p, [field]: val } : p)))

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Input
              placeholder={t('inputKey')}
              value={pair.key}
              onChange={(e) => updatePair(i, 'key', e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div className="min-w-0 flex-[2]">
            <Textarea
              placeholder={t('inputValue')}
              value={pair.value}
              onChange={(e) => updatePair(i, 'value', e.target.value)}
              className="h-8 min-h-[32px] resize-none py-1.5 text-xs leading-relaxed"
              rows={1}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${el.scrollHeight}px`
              }}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onChange(pairs.filter((_, idx) => idx !== i))}
            disabled={pairs.length === 1}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
            title={t('removeInput')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...pairs, { key: '', value: '' }])}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        {t('addInput')}
      </Button>
    </div>
  )
}
