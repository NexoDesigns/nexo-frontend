'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Plus, Trash2, Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyValuePair {
  key: string
  value: string
}

interface PhaseInputFormProps {
  phaseId: string
  defaultInputs?: Record<string, unknown>
  isLoading?: boolean
  onSubmit: (inputs: Record<string, unknown>) => void
  className?: string
}

export function PhaseInputForm({
  phaseId,
  defaultInputs = {},
  isLoading = false,
  onSubmit,
  className,
}: PhaseInputFormProps) {
  const t = useTranslations('pipeline')

  // Hydrate from defaultInputs (previous run's inputs)
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    const entries = Object.entries(defaultInputs)
    if (entries.length === 0) return [{ key: '', value: '' }]
    return entries.map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
  })

  const addPair = () => {
    setPairs((prev) => [...prev, { key: '', value: '' }])
  }

  const removePair = (index: number) => {
    setPairs((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePair = (
    index: number,
    field: 'key' | 'value',
    val: string
  ) => {
    setPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const inputs: Record<string, unknown> = {}
    pairs.forEach(({ key, value }) => {
      if (key.trim()) {
        // Try to parse JSON values, fall back to string
        try {
          inputs[key.trim()] = JSON.parse(value)
        } catch {
          inputs[key.trim()] = value
        }
      }
    })
    onSubmit(inputs)
  }

  const hasValidPair = pairs.some((p) => p.key.trim())

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <div className="space-y-2">
        {pairs.map((pair, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              <Input
                placeholder={t('inputKey')}
                value={pair.key}
                onChange={(e) => updatePair(i, 'key', e.target.value)}
                className="font-mono text-xs h-8"
              />
            </div>
            <div className="flex-[2] min-w-0">
              <Textarea
                placeholder={t('inputValue')}
                value={pair.value}
                onChange={(e) => updatePair(i, 'value', e.target.value)}
                className="text-xs min-h-[32px] h-8 resize-none leading-relaxed py-1.5"
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
              onClick={() => removePair(i)}
              disabled={pairs.length === 1}
              className="shrink-0 text-muted-foreground hover:text-destructive mt-0.5"
              title={t('removeInput')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addPair}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Plus className="h-3 w-3" />
          {t('addInput')}
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !hasValidPair}
          className="gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('executing')}
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              {t('executePhase')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
