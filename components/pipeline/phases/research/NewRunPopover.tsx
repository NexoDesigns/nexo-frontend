'use client'

import { forwardRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { ChevronRight, Info, Loader2 } from 'lucide-react'
import { requirementsRunsApi, runsApi } from '@/lib/api'
import { POPOVER } from '@/lib/design-constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  ExtraInputsEditor,
  inputsFromPairs,
  pairsFromInputs,
  type KeyValuePair,
} from '../../ExtraInputsEditor'
import type { Project } from '@/types'

interface NewRunPopoverProps {
  project: Project
  /** custom_inputs of the active research run, to start from */
  defaultInputs: Record<string, unknown>
  onStarted: (runId: string) => void
  onClose: () => void
}

/** Options for a new Research run (design 4a), plus the power-user extras under Advanced. */
export const NewRunPopover = forwardRef<HTMLDivElement, NewRunPopoverProps>(function NewRunPopover(
  { project, defaultInputs, onStarted, onClose },
  ref
) {
  const t = useTranslations('pipeline')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const projectId = project.id

  const { data: requirementsRuns } = useQuery({
    queryKey: ['requirements-runs', projectId],
    queryFn: () => requirementsRunsApi.list(projectId),
  })
  const specRuns = [...(requirementsRuns ?? [])]
    .filter((r) => r.status === 'completed' && r.output_drive_url)
    .sort((a, b) => b.run_number - a.run_number)
  const defaultSpecRunId =
    specRuns.find((r) => r.id === project.active_requirements_run_id)?.id ?? specRuns[0]?.id ?? ''

  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const chosenSpecRunId = specRunId ?? defaultSpecRunId
  const [webSearch, setWebSearch] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [notes, setNotes] = useState('')
  // requirements_drive_url is set from the dropdown, never edited by hand
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    const rest = { ...defaultInputs }
    delete rest.requirements_drive_url
    return pairsFromInputs(rest)
  })

  const trigger = useMutation({
    mutationFn: () =>
      runsApi.trigger(projectId, 'research', {
        use_perplexity: webSearch,
        custom_inputs: {
          ...inputsFromPairs(pairs),
          requirements_drive_url:
            specRuns.find((r) => r.id === chosenSpecRunId)?.output_drive_url ?? null,
        },
      }),
    onSuccess: ({ run_id }) => {
      queryClient.invalidateQueries({ queryKey: ['runs', projectId, 'research'] })
      if (notes.trim()) {
        runsApi.updateNotes(projectId, 'research', run_id, notes.trim()).then(() => {
          queryClient.invalidateQueries({ queryKey: ['runs', projectId, 'research'] })
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

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">{t('technicalSpecifications')}</span>
        {specRuns.length > 0 ? (
          <select
            value={chosenSpecRunId}
            onChange={(e) => setSpecRunId(e.target.value)}
            className="h-[34px] rounded-[5px] border border-input bg-sidebar px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {specRuns.map((r) => (
              <option key={r.id} value={r.id} className="bg-card">
                {r.id === project.active_requirements_run_id
                  ? t('reqRunOptionActive', { number: r.run_number })
                  : t('reqRunOption', { number: r.run_number })}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs italic text-muted-foreground">{t('noRequirementsRuns')}</span>
        )}
      </label>

      <button
        type="button"
        role="switch"
        aria-checked={webSearch}
        onClick={() => setWebSearch((v) => !v)}
        className="flex h-[34px] items-center gap-3 rounded-[5px] border border-input bg-sidebar px-3 text-left text-[13px] text-foreground"
      >
        <span className="flex flex-1 items-center gap-1.5">
          {t('webSearch')}
          <TooltipPrimitive.Provider delayDuration={200}>
            <TooltipPrimitive.Root>
              <TooltipPrimitive.Trigger asChild>
                <span onClick={(e) => e.stopPropagation()} className="flex text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipPrimitive.Trigger>
              <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                  side="top"
                  sideOffset={6}
                  className="z-50 max-w-[240px] rounded-md border border-border bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-md"
                >
                  {t('perplexityTooltip')}
                </TooltipPrimitive.Content>
              </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
          </TooltipPrimitive.Provider>
        </span>
        <span
          className={cn(
            'relative h-[18px] w-8 shrink-0 rounded-full transition-colors',
            webSearch ? 'bg-primary' : 'bg-border'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-[left]',
              webSearch ? 'left-4' : 'left-0.5'
            )}
          />
        </span>
      </button>

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
        <Button size="sm" onClick={() => trigger.mutate()} disabled={trigger.isPending}>
          {trigger.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('runAction')}
        </Button>
      </div>
    </div>
  )
})
