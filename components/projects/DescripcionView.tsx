'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  NORMATIVE_INDUSTRIES,
  NORMATIVE_CLIENT_TYPES,
  NORMATIVE_AGE_RANGES,
  NORMATIVE_COUNTRIES,
} from '@/lib/constants'
import type { Project } from '@/types'

interface DescripcionViewProps {
  projectId: string
  project: Project
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
      {children}
    </p>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="text-xs text-muted-foreground flex items-center gap-1">
      {children}
      {hint && <span className="normal-case font-normal">({hint})</span>}
    </label>
  )
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'text-foreground'
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ─── Country pill selector ────────────────────────────────────────────────────

function CountryPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (codes: string[]) => void
}) {
  const toggle = (code: string) => {
    onChange(
      selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {NORMATIVE_COUNTRIES.map(({ code, label }) => {
        const active = selected.includes(code)
        return (
          <button
            key={code}
            type="button"
            onClick={() => toggle(code)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] border transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DescripcionView({ projectId, project }: DescripcionViewProps) {
  const t = useTranslations('descripcion')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  // Project info fields
  const [name, setName] = useState(project.name)
  const [clientName, setClientName] = useState(project.client_name ?? '')
  const [description, setDescription] = useState(project.description ?? '')

  // Normative context fields
  const [industry, setIndustry] = useState(project.normative_industry ?? '')
  const [clientType, setClientType] = useState(project.normative_client_type ?? '')
  const [ageRange, setAgeRange] = useState(project.normative_user_age_range ?? '')
  const [countries, setCountries] = useState<string[]>(
    project.normative_target_countries ?? []
  )
  const [extraContext, setExtraContext] = useState(project.normative_extra_context ?? '')

  const [saved, setSaved] = useState(false)

  // Translated option lists
  const industryOptions = NORMATIVE_INDUSTRIES.map((v) => ({
    value: v,
    label: t(`industry_${v}` as Parameters<typeof t>[0]),
  }))
  const clientTypeOptions = NORMATIVE_CLIENT_TYPES.map((v) => ({
    value: v,
    label: t(`clientType_${v}` as Parameters<typeof t>[0]),
  }))
  const ageRangeOptions = NORMATIVE_AGE_RANGES.map((v) => ({
    value: v,
    label: t(`ageRange_${v}` as Parameters<typeof t>[0]),
  }))

  const saveMutation = useMutation({
    mutationFn: () =>
      projectsApi.update(projectId, {
        name: name.trim() || project.name,
        client_name: clientName.trim() || null,
        description: description.trim() || null,
        normative_industry: industry || null,
        normative_client_type: clientType || null,
        normative_user_age_range: ageRange || null,
        normative_target_countries: countries.length > 0 ? countries : null,
        normative_extra_context: extraContext.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">

      {/* ── Project info ── */}
      <div>
        <SectionLabel>{t('projectInfo')}</SectionLabel>
        <div className="space-y-3">
          <div className="space-y-1">
            <FieldLabel>{t('projectNameLabel')}</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel hint={tCommon('optional')}>{t('clientNameLabel')}</FieldLabel>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t('clientNameLabel')}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1">
            <FieldLabel hint={tCommon('optional')}>{t('descriptionLabel')}</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Normative context ── */}
      <div>
        <SectionLabel>{t('normativeContext')}</SectionLabel>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <FieldLabel>{t('industry')}</FieldLabel>
              <SelectField
                value={industry}
                onChange={setIndustry}
                options={industryOptions}
                placeholder={t('selectOption')}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel>{t('clientType')}</FieldLabel>
              <SelectField
                value={clientType}
                onChange={setClientType}
                options={clientTypeOptions}
                placeholder={t('selectOption')}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel>{t('ageRange')}</FieldLabel>
              <SelectField
                value={ageRange}
                onChange={setAgeRange}
                options={ageRangeOptions}
                placeholder={t('selectOption')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>{t('targetCountries')}</FieldLabel>
            <CountryPicker selected={countries} onChange={setCountries} />
          </div>

          <div className="space-y-1">
            <FieldLabel hint={tCommon('optional')}>{t('extraContext')}</FieldLabel>
            <Textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder={t('extraContextPlaceholder')}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Save button ── */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? t('saved') : tCommon('save')}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-xs text-destructive text-right">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : t('saveError')}
        </p>
      )}
    </div>
  )
}
