'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExtraInputsEditor, inputsFromPairs, pairsFromInputs, type KeyValuePair } from './ExtraInputsEditor'

export interface PhaseFormPayload {
  inputs: Record<string, unknown>
  notes?: string
}

interface PhaseInputFormProps {
  phaseId: string
  defaultInputs?: Record<string, unknown>
  isLoading?: boolean
  submitDisabled?: boolean
  onSubmit: (payload: PhaseFormPayload) => void
  className?: string
}

export function PhaseInputForm({
  defaultInputs = {},
  isLoading = false,
  submitDisabled = false,
  onSubmit,
  className,
}: PhaseInputFormProps) {
  const t = useTranslations('pipeline')
  const tStatus = useTranslations('status')
  const [notes, setNotes] = useState('')

  // Hydrate from defaultInputs (previous run's inputs)
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => pairsFromInputs(defaultInputs))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ inputs: inputsFromPairs(pairs), notes: notes.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <ExtraInputsEditor pairs={pairs} onChange={setPairs} />

      <Textarea
        placeholder={t('notesPlaceholder')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={isLoading}
        className="text-xs min-h-[32px] resize-none leading-relaxed py-1.5"
        rows={2}
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || submitDisabled}
          className="gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {tStatus('executing')}
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
