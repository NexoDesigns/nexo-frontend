'use client'

import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Loader2, Save } from 'lucide-react'
import type { ProjectRequirements, UpsertRequirementsPayload } from '@/types'

interface RequirementsFormProps {
  projectId: string
  initialData?: ProjectRequirements | null
  onSaved?: () => void
}

export function RequirementsForm({
  projectId,
  initialData,
  onSaved,
}: RequirementsFormProps) {
  const t = useTranslations('requirements')
  const tProjects = useTranslations('projects')
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { isDirty } } = useForm<UpsertRequirementsPayload>({
    defaultValues: {
      input_voltage_min: initialData?.input_voltage_min ?? undefined,
      input_voltage_max: initialData?.input_voltage_max ?? undefined,
      output_voltage: initialData?.output_voltage ?? undefined,
      max_current: initialData?.max_current ?? undefined,
      max_ripple_percent: initialData?.max_ripple_percent ?? undefined,
      temperature_range: initialData?.temperature_range ?? '',
      main_function: initialData?.main_function ?? '',
      constraints: initialData?.constraints ?? '',
      kpis: initialData?.kpis ?? '',
      notes: initialData?.notes ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UpsertRequirementsPayload) =>
      projectsApi.upsertRequirements(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements', projectId] })
      onSaved?.()
    },
  })

  const onSubmit = (data: UpsertRequirementsPayload) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Voltage / current grid */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {t('electricalTitle')}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="input_voltage_min">{t('inputVoltageMin')}</Label>
            <Input
              id="input_voltage_min"
              type="number"
              step="0.1"
              placeholder="10"
              {...register('input_voltage_min', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="input_voltage_max">{t('inputVoltageMax')}</Label>
            <Input
              id="input_voltage_max"
              type="number"
              step="0.1"
              placeholder="14"
              {...register('input_voltage_max', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="output_voltage">{t('outputVoltage')}</Label>
            <Input
              id="output_voltage"
              type="number"
              step="0.1"
              placeholder="5"
              {...register('output_voltage', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_current">{t('maxCurrent')}</Label>
            <Input
              id="max_current"
              type="number"
              step="0.1"
              placeholder="1"
              {...register('max_current', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="max_ripple_percent">{t('maxRipple')}</Label>
          <Input
            id="max_ripple_percent"
            type="number"
            step="0.1"
            placeholder="10"
            {...register('max_ripple_percent', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temperature_range">{t('temperatureRange')}</Label>
          <Input
            id="temperature_range"
            placeholder="-40°C to +85°C"
            {...register('temperature_range')}
          />
        </div>
      </div>

      {/* Text fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="main_function">{t('mainFunction')}</Label>
          <Input
            id="main_function"
            placeholder="Step-down DC-DC converter"
            {...register('main_function')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="constraints">{t('constraints')}</Label>
          <Textarea
            id="constraints"
            placeholder="1A maximum output current, 10% maximum ripple..."
            rows={2}
            {...register('constraints')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="kpis">{t('kpis')}</Label>
          <Input
            id="kpis"
            placeholder="Size, Efficiency, Cost"
            {...register('kpis')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">{t('notes')}</Label>
          <Textarea
            id="notes"
            placeholder="Provide input and output connectors, protection elements..."
            rows={3}
            {...register('notes')}
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Error al guardar los requisitos'}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="text-xs text-success">{tProjects('requirementsSaved')}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending || !isDirty}
          className="gap-1.5"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {tProjects('saveRequirements')}
        </Button>
      </div>
    </form>
  )
}
