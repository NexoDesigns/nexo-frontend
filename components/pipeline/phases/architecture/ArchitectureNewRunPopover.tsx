'use client'

import { forwardRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Loader2 } from 'lucide-react'
import { runsApi } from '@/lib/api'
import { POPOVER } from '@/lib/design-constants'
import { cn } from '@/lib/utils'
import { useIcDesignSelection } from '@/hooks/usePhaseSelections'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { IcDesignPicker } from '../../IcDesignPicker'
import {
  ExtraInputsEditor,
  inputsFromPairs,
  pairsFromInputs,
  type KeyValuePair,
} from '../../ExtraInputsEditor'

interface ArchitectureNewRunPopoverProps {
  projectId: string
  /** custom_inputs of the active architecture run, to start from */
  defaultInputs: Record<string, unknown>
  onStarted: (runId: string) => void
  onClose: () => void
}

/**
 * Options for a new Architecture run (design 5a): the IC design to build from,
 * plus the power-user extras under Advanced.
 */
export const ArchitectureNewRunPopover = forwardRef<HTMLDivElement, ArchitectureNewRunPopoverProps>(
  function ArchitectureNewRunPopover({ projectId, defaultInputs, onStarted, onClose }, ref) {
    const t = useTranslations('pipeline')
    const tCommon = useTranslations('common')
    const queryClient = useQueryClient()
    const icDesign = useIcDesignSelection(projectId)

    const [advancedOpen, setAdvancedOpen] = useState(false)
    const [notes, setNotes] = useState('')
    // selected_design_id comes from the picker, never edited by hand
    const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
      const rest = { ...defaultInputs }
      delete rest.selected_design_id
      return pairsFromInputs(rest)
    })

    const trigger = useMutation({
      mutationFn: () =>
        runsApi.trigger(projectId, 'architecture_agent', {
          custom_inputs: { ...inputsFromPairs(pairs), selected_design_id: icDesign.selectedDesignId },
        }),
      onSuccess: ({ run_id }) => {
        queryClient.invalidateQueries({ queryKey: ['runs', projectId, 'architecture_agent'] })
        if (notes.trim()) {
          runsApi.updateNotes(projectId, 'architecture_agent', run_id, notes.trim()).then(() => {
            queryClient.invalidateQueries({ queryKey: ['runs', projectId, 'architecture_agent'] })
          })
        }
        onStarted(run_id)
      },
    })

    return (
      <div
        ref={ref}
        className="absolute right-0 top-10 z-30 flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto rounded-lg border border-border bg-card p-4 shadow-[0_12px_32px_rgba(0,0,0,.45)]"
        style={{ width: POPOVER.newRunWidth, maxWidth: 'calc(100vw - 32px)' }}
      >
        <span className="text-sm font-semibold text-foreground">{t('newRun')}</span>

        <div className="flex flex-col gap-1.5">
          <IcDesignPicker
            icSelectionOutput={icDesign.icSelectionRun?.output_payload as Record<string, unknown> | null}
            selectedDesignId={icDesign.selectedDesignId}
            onSelect={icDesign.setDesignId}
          />
          {icDesign.saveError && <p className="text-xs text-destructive">{t('selectionSaveError')}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-90')} />
            {t('advanced')}
          </button>
          {advancedOpen && (
            <div className="flex flex-col gap-2.5">
              <Textarea
                placeholder={t('notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[32px] resize-none py-1.5 text-xs leading-relaxed"
                rows={2}
              />
              <ExtraInputsEditor pairs={pairs} onChange={setPairs} />
            </div>
          )}
        </div>

        {trigger.isError && (
          <p className="text-xs text-destructive">
            {trigger.error instanceof Error ? trigger.error.message : t('launchError')}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={trigger.isPending}>
            {tCommon('cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() => trigger.mutate()}
            disabled={trigger.isPending || !icDesign.selectedDesignId}
          >
            {trigger.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('runAction')}
          </Button>
        </div>
      </div>
    )
  }
)
