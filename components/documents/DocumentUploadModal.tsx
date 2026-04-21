'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Label } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/primitives'
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Folder,
  Globe,
} from 'lucide-react'
import type { Document, DocumentType, NormativeUploadMetadata } from '@/types'
import { DOC_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = '.pdf,.xlsx,.xls,.docx,.txt'
const MAX_SIZE_MB = 50

const ISSUING_BODIES = ['IEC', 'ISO', 'CENELEC', 'FCC', 'UL', 'IEEE', 'ANSI', 'Other']

const NORMATIVE_INDUSTRIES = [
  'Consumer Electronics', 'Industrial', 'Medical', 'Automotive', 'IT',
]
const NORMATIVE_USER_TYPES = ['Consumer', 'Professional', 'Child']
const NORMATIVE_COUNTRIES = [
  'EU', 'US', 'UK', 'CA', 'JP', 'CN', 'MX', 'BR', 'Global',
]

interface DocumentUploadModalProps {
  open: boolean
  onClose: () => void
  projectId?: string
  queryKey: string[]
  projectName?: string
}

function ChipMulti({
  values,
  options,
  onChange,
}: {
  values: string[]
  options: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={cn(
            'px-2.5 h-7 rounded-md text-xs font-medium border transition-colors',
            values.includes(o)
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-card border-input text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export function DocumentUploadModal({
  open,
  onClose,
  projectId,
  queryKey,
  projectName,
}: DocumentUploadModalProps) {
  const t = useTranslations('documents')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [docType, setDocType] = useState<DocumentType>('datasheet')
  const [scope, setScope] = useState<'project' | 'global'>(
    projectId ? 'project' : 'global'
  )
  const [norm, setNorm] = useState<Required<NormativeUploadMetadata>>({
    standard_code: '',
    standard_version: '',
    issuing_body: '',
    applicable_industries: [],
    applicable_countries: [],
    applicable_user_types: [],
    scope_summary: '',
  })

  // Reset on close
  useEffect(() => {
    if (!open) {
      setFile(null)
      setDragging(false)
      setSizeError(false)
      setDocType('datasheet')
      setScope(projectId ? 'project' : 'global')
      setNorm({
        standard_code: '',
        standard_version: '',
        issuing_body: '',
        applicable_industries: [],
        applicable_countries: [],
        applicable_user_types: [],
        scope_summary: '',
      } as Required<NormativeUploadMetadata>)
    }
  }, [open, projectId])

  const mutation = useMutation({
    mutationFn: (f: File) =>
      documentsApi.upload(f, {
        type: docType,
        project_id: scope === 'project' ? projectId : undefined,
        normative_metadata:
          docType === 'normative'
            ? {
                standard_code: norm.standard_code,
                standard_version: norm.standard_version || undefined,
                issuing_body: norm.issuing_body || undefined,
                applicable_industries:
                  norm.applicable_industries.length > 0
                    ? norm.applicable_industries
                    : undefined,
                applicable_countries:
                  norm.applicable_countries.length > 0
                    ? norm.applicable_countries
                    : undefined,
                applicable_user_types:
                  norm.applicable_user_types.length > 0
                    ? norm.applicable_user_types
                    : undefined,
                scope_summary: norm.scope_summary || undefined,
              }
            : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      onClose()
    },
  })

  const handleFile = (f: File) => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setSizeError(true)
      setFile(null)
      return
    }
    setSizeError(false)
    setFile(f)
  }

  const isNormative = docType === 'normative'
  const canSubmit =
    !!file &&
    !mutation.isPending &&
    (!isNormative || norm.standard_code.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('upload')}</DialogTitle>
          <DialogDescription>{t('uploadDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) handleFile(f)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center gap-2',
              'rounded-lg border-2 border-dashed p-6 transition-colors text-center',
              dragging
                ? 'border-primary bg-primary/5'
                : file
                ? 'border-success/50 bg-success/5'
                : 'border-border hover:border-border/80 hover:bg-accent/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {file ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="text-sm font-medium text-foreground truncate max-w-[400px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline mt-1"
                >
                  Replace file
                </button>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">
                    {t('dropzone')} <span className="text-primary">{t('browse')}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('uploadDescription')}
                  </p>
                </div>
              </>
            )}
          </div>

          {sizeError && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {t('fileTooLarge', { size: MAX_SIZE_MB })}
            </div>
          )}

          {/* Type + scope */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc-type-modal">{t('documentType')}</Label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as DocumentType)}
              >
                <SelectTrigger id="doc-type-modal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-scope">{t('scope')}</Label>
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as 'project' | 'global')}
              >
                <SelectTrigger id="doc-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectId && (
                    <SelectItem value="project">
                      <span className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5" />
                        {projectName ? projectName : t('scopeProject')}
                      </span>
                    </SelectItem>
                  )}
                  <SelectItem value="global">
                    <span className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" />
                      {t('scopeGlobal')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional normative block */}
          {isNormative && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4 animate-fade-in">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('normativeMetadata')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t('normativeMetadataDesc')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="norm-code">
                    {t('standardCode')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="norm-code"
                    placeholder={t('standardCodePlaceholder')}
                    value={norm.standard_code}
                    onChange={(e) =>
                      setNorm((n) => ({ ...n, standard_code: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="norm-version">{t('version')}</Label>
                  <Input
                    id="norm-version"
                    placeholder={t('versionPlaceholder')}
                    value={norm.standard_version}
                    onChange={(e) =>
                      setNorm((n) => ({ ...n, standard_version: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="norm-body">{t('issuingBody')}</Label>
                <Select
                  value={norm.issuing_body}
                  onValueChange={(v) =>
                    setNorm((n) => ({ ...n, issuing_body: v }))
                  }
                >
                  <SelectTrigger id="norm-body">
                    <SelectValue placeholder={t('issuingBodyPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUING_BODIES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t('industries')}</Label>
                <ChipMulti
                  values={norm.applicable_industries}
                  options={NORMATIVE_INDUSTRIES}
                  onChange={(v) =>
                    setNorm((n) => ({ ...n, applicable_industries: v }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('countries')}</Label>
                <ChipMulti
                  values={norm.applicable_countries}
                  options={NORMATIVE_COUNTRIES}
                  onChange={(v) =>
                    setNorm((n) => ({ ...n, applicable_countries: v }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('userTypes')}</Label>
                <ChipMulti
                  values={norm.applicable_user_types}
                  options={NORMATIVE_USER_TYPES}
                  onChange={(v) =>
                    setNorm((n) => ({ ...n, applicable_user_types: v }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="norm-scope">{t('scopeSummaryLabel')}</Label>
                <Textarea
                  id="norm-scope"
                  rows={2}
                  placeholder={t('scopeSummaryPlaceholder')}
                  value={norm.scope_summary}
                  onChange={(e) =>
                    setNorm((n) => ({ ...n, scope_summary: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {t('uploadError')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <p className="text-[11px] text-muted-foreground">
            {isNormative ? t('metadataEditNote') : t('indexingNote')}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => file && mutation.mutate(file)}
              disabled={!canSubmit}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  {t('upload')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
