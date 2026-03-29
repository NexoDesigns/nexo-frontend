'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Plus, Trash2, Play, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeyValuePair {
  key: string
  value: string
}

export interface PhaseFormPayload {
  inputs: Record<string, unknown>
}

interface PhaseInputFormProps {
  phaseId: string
  defaultInputs?: Record<string, unknown>
  usePerplexity?: boolean
  onUsePerplexityChange?: (v: boolean) => void
  isLoading?: boolean
  submitDisabled?: boolean
  onSubmit: (payload: PhaseFormPayload) => void
  className?: string
}

export function PhaseInputForm({
  phaseId,
  defaultInputs = {},
  usePerplexity = true,
  onUsePerplexityChange,
  isLoading = false,
  submitDisabled = false,
  onSubmit,
  className,
}: PhaseInputFormProps) {
  const t = useTranslations('pipeline')
  const isResearch = phaseId === 'research'

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
    onSubmit({ inputs })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      {isResearch && (
        <div className="flex items-center gap-2">
          <input
            id="use-perplexity"
            type="checkbox"
            checked={usePerplexity}
            onChange={(e) => onUsePerplexityChange?.(e.target.checked)}
            disabled={isLoading}
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
          />
          <label
            htmlFor="use-perplexity"
            className="text-xs text-foreground cursor-pointer select-none flex items-center gap-1"
          >
            {t('usePerplexity')}
            <TooltipPrimitive.Provider delayDuration={200}>
              <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content
                    side="right"
                    sideOffset={6}
                    className="z-50 max-w-[220px] rounded-md border border-border bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-md"
                  >
                    {t('perplexityTooltip')}
                    <TooltipPrimitive.Arrow className="fill-border" />
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            </TooltipPrimitive.Provider>
          </label>
        </div>
      )}

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
          disabled={isLoading || submitDisabled}
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
