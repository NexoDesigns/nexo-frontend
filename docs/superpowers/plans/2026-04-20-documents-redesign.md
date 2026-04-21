# Documents Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Documents section to have a search/filter/sort toolbar, documents grouped by type, per-row download and open-in-tab actions, and an upload modal (replacing the inline upload form) with conditional normative metadata fields.

**Architecture:** `DocumentList` becomes a fully self-contained section component owning toolbar state, modal state, and grouped rendering. A new `DocumentUploadModal` handles file picking, type/scope selection, and conditional normative fields. `DocumentUpload` (inline form) is deleted since both project and knowledge-base pages move to the modal pattern.

**Tech Stack:** Next.js 15, React 18, TypeScript, TanStack Query v5, next-intl, Radix UI Dialog, lucide-react, Tailwind CSS

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/api.ts` | Add `documentsApi.getDownloadUrl` and normative metadata support to `upload` |
| Modify | `messages/en.json` | Add new i18n keys for toolbar, upload modal, normative fields |
| Modify | `messages/es.json` | Spanish equivalents |
| Create | `components/documents/DocumentUploadModal.tsx` | Drop-zone modal with type/scope selectors and conditional normative block |
| Modify | `components/documents/DocumentList.tsx` | Full redesign: toolbar + grouped-by-type list + download/open/delete per row |
| Delete | `components/documents/DocumentUpload.tsx` | Replaced by `DocumentUploadModal` |
| Modify | `src/app/[locale]/(dashboard)/projects/[id]/page.tsx` | Simplify documents tab to `<DocumentList projectId={id} …>` |
| Modify | `src/app/[locale]/(dashboard)/knowledge-base/page.tsx` | Same pattern, no `projectId` |

---

## Task 1: Extend API and i18n

**Files:**
- Modify: `src/lib/api.ts:152-196`
- Modify: `messages/en.json`
- Modify: `messages/es.json`

### 1.1 Add `documentsApi.getDownloadUrl` and normative metadata support

In `src/lib/api.ts`, locate the `documentsApi` object (line 152) and add after the `delete` method and update `upload`:

```ts
// In the upload method, after the existing formData.append lines:
//   if (meta.normative_metadata) {
//     formData.append('normative_metadata', JSON.stringify(meta.normative_metadata))
//   }
// And add a new method:
//   getDownloadUrl: (id: string) =>
//     apiFetch<{ url: string }>(`/documents/${id}/download-url`),
```

The full updated `documentsApi` block (replace lines 152–196):

```ts
export const documentsApi = {
  list: (params?: { project_id?: string; type?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v != null) as [
        string,
        string,
      ][]
    ).toString()
    return apiFetch<Document[]>(`/documents${qs ? `?${qs}` : ''}`)
  },

  upload: async (file: File, meta: {
    type: Document['type']
    project_id?: string
    normative_metadata?: {
      standard_code: string
      standard_version?: string
      issuing_body?: string
      applicable_industries?: string[]
      applicable_countries?: string[]
      applicable_user_types?: string[]
      scope_summary?: string
    }
  }) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', meta.type)
    if (meta.project_id) formData.append('project_id', meta.project_id)
    if (meta.normative_metadata) {
      formData.append('normative_metadata', JSON.stringify(meta.normative_metadata))
    }

    const res = await fetch(`${BASE_URL}/document/upload`, {
      method: 'POST',
      headers: {
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
      throw new Error(err.detail)
    }

    return res.json() as Promise<Document>
  },

  delete: (id: string) =>
    apiFetch<void>(`/documents/${id}`, { method: 'DELETE' }),

  getDownloadUrl: (id: string) =>
    apiFetch<{ url: string }>(`/documents/${id}/download-url`),
}
```

### 1.2 Add i18n keys to `messages/en.json`

Inside the `"documents"` object, add these keys (after `"fileTooLarge"`):

```json
"searchPlaceholder": "Search by name, source, standard code…",
"allTypes": "All types",
"allScopes": "All scopes",
"scopeProject": "This project",
"scopeGlobal": "Global",
"sortRecent": "Most recent",
"sortOldest": "Oldest first",
"sortNameAsc": "Name (A → Z)",
"sortNameDesc": "Name (Z → A)",
"sortSizeDesc": "Largest first",
"sortSizeAsc": "Smallest first",
"showing": "Showing {filtered} of {total} documents",
"clearFilters": "Clear filters ({count})",
"library": "Library",
"collapseAll": "Collapse all",
"expandAll": "Expand all",
"noMatch": "No documents match your filters",
"noMatchDesc": "Try widening the filters or clearing the search.",
"emptyDesc": "Upload a PDF, Excel, DOCX or TXT — agents will index it automatically.",
"openNewTab": "Open in new tab",
"normativeMetadata": "Normative metadata",
"normativeMetadataDesc": "Helps agents match this standard to projects. All optional except Standard code.",
"standardCode": "Standard code",
"standardCodePlaceholder": "e.g. IEC 62368-1",
"version": "Version",
"versionPlaceholder": "e.g. 3.0 (2018)",
"issuingBody": "Issuing body",
"issuingBodyPlaceholder": "Select issuing body…",
"industries": "Applicable industries",
"countries": "Countries / regions",
"userTypes": "User types",
"scopeSummaryLabel": "Scope summary",
"scopeSummaryPlaceholder": "One-sentence summary of what this standard covers…",
"metadataEditNote": "Metadata can be edited later from the normative card.",
"indexingNote": "Document will be indexed automatically after upload.",
"uploading": "Uploading…"
```

### 1.3 Add i18n keys to `messages/es.json`

Inside the `"documents"` object, add these keys (after `"fileTooLarge"`):

```json
"searchPlaceholder": "Buscar por nombre, fuente, código de norma…",
"allTypes": "Todos los tipos",
"allScopes": "Todos los ámbitos",
"scopeProject": "Este proyecto",
"scopeGlobal": "Global",
"sortRecent": "Más recientes",
"sortOldest": "Más antiguos",
"sortNameAsc": "Nombre (A → Z)",
"sortNameDesc": "Nombre (Z → A)",
"sortSizeDesc": "Mayor tamaño",
"sortSizeAsc": "Menor tamaño",
"showing": "Mostrando {filtered} de {total} documentos",
"clearFilters": "Limpiar filtros ({count})",
"library": "Biblioteca",
"collapseAll": "Colapsar todo",
"expandAll": "Expandir todo",
"noMatch": "Ningún documento coincide con los filtros",
"noMatchDesc": "Prueba a ampliar los filtros o limpiar la búsqueda.",
"emptyDesc": "Sube un PDF, Excel, DOCX o TXT — los agentes lo indexarán automáticamente.",
"openNewTab": "Abrir en nueva pestaña",
"normativeMetadata": "Metadatos de normativa",
"normativeMetadataDesc": "Ayuda a los agentes a relacionar esta norma con proyectos. Todo opcional excepto el Código de norma.",
"standardCode": "Código de norma",
"standardCodePlaceholder": "ej. IEC 62368-1",
"version": "Versión",
"versionPlaceholder": "ej. 3.0 (2018)",
"issuingBody": "Organismo emisor",
"issuingBodyPlaceholder": "Selecciona organismo…",
"industries": "Industrias aplicables",
"countries": "Países / regiones",
"userTypes": "Tipos de usuario",
"scopeSummaryLabel": "Resumen del alcance",
"scopeSummaryPlaceholder": "Resumen en una frase de lo que cubre esta norma…",
"metadataEditNote": "Los metadatos se pueden editar más tarde desde la tarjeta de normativa.",
"indexingNote": "El documento se indexará automáticamente tras la subida.",
"uploading": "Subiendo…"
```

- [ ] Apply the `documentsApi` replacement in `src/lib/api.ts`
- [ ] Add new keys to `messages/en.json` inside the `"documents"` object
- [ ] Add new keys to `messages/es.json` inside the `"documents"` object
- [ ] Commit: `git add src/lib/api.ts messages/en.json messages/es.json && git commit -m "feat(documents): add getDownloadUrl, normative upload metadata, i18n keys"`

---

## Task 2: Create `DocumentUploadModal`

**Files:**
- Create: `components/documents/DocumentUploadModal.tsx`

This modal replaces the inline `DocumentUpload` component. It opens as a Radix Dialog, has a drop-zone, type + scope selectors, and a conditional normative metadata block that slides in when type = `'normative'`.

- [ ] Create `components/documents/DocumentUploadModal.tsx` with the full content below:

```tsx
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
import type { Document, DocumentType } from '@/types'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = '.pdf,.xlsx,.xls,.docx,.txt'
const MAX_SIZE_MB = 50

const DOCUMENT_TYPES: DocumentType[] = [
  'datasheet',
  'normative',
  'manufacturer_list',
  'design_note',
  'reference_schematic',
  'project_output',
  'other',
]

const ISSUING_BODIES = ['IEC', 'ISO', 'CENELEC', 'FCC', 'UL', 'IEEE', 'ANSI', 'Other']

const NORMATIVE_INDUSTRIES = [
  'Consumer Electronics', 'Industrial', 'Medical', 'Automotive', 'IT',
]
const NORMATIVE_USER_TYPES = ['Consumer', 'Professional', 'Child']
const NORMATIVE_COUNTRIES = [
  'EU', 'US', 'UK', 'CA', 'JP', 'CN', 'MX', 'BR', 'Global',
]

interface NormativeFields {
  standard_code: string
  standard_version: string
  issuing_body: string
  applicable_industries: string[]
  applicable_countries: string[]
  applicable_user_types: string[]
  scope_summary: string
}

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
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [docType, setDocType] = useState<DocumentType>('datasheet')
  const [scope, setScope] = useState<'project' | 'global'>(
    projectId ? 'project' : 'global'
  )
  const [norm, setNorm] = useState<NormativeFields>({
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
      })
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
            onDragLeave={() => setDragging(false)}
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
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-scope">{t('scopeProject').replace('This ', 'Scope: ')}</Label>
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
              Cancel
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
```

- [ ] Create the file as shown above
- [ ] Commit: `git add components/documents/DocumentUploadModal.tsx && git commit -m "feat(documents): add DocumentUploadModal with normative metadata fields"`

---

## Task 3: Redesign `DocumentList`

**Files:**
- Modify: `components/documents/DocumentList.tsx` (full replacement)

This is the main component: it owns search/filter/sort state, the upload modal open/close state, and renders the toolbar + grouped list. The `scope` of each document is derived from `doc.project_id === null ? 'global' : 'project'`.

- [ ] Replace the full content of `components/documents/DocumentList.tsx` with:

```tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/primitives'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatRelativeDate, formatFileSize } from '@/lib/utils'
import { useLocale } from 'next-intl'
import {
  FileText,
  Shield,
  Table2,
  CircuitBoard,
  FileCode2,
  GitBranch,
  File,
  Download,
  ExternalLink,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Plus,
  Folder,
  Globe,
  ArrowUpDown,
  FileEdit,
} from 'lucide-react'
import type { Document, DocumentType, EmbeddingStatus } from '@/types'
import { cn } from '@/lib/utils'
import { DocumentUploadModal } from './DocumentUploadModal'

// ── Constants ──────────────────────────────────────────────────────────────

const DOC_TYPES: DocumentType[] = [
  'datasheet',
  'normative',
  'manufacturer_list',
  'reference_schematic',
  'design_note',
  'project_output',
  'other',
]

function TypeIcon({ type, className }: { type: DocumentType; className?: string }) {
  const cls = cn('h-4 w-4', className)
  switch (type) {
    case 'datasheet':           return <FileText className={cls} />
    case 'normative':           return <Shield className={cls} />
    case 'manufacturer_list':   return <Table2 className={cls} />
    case 'reference_schematic': return <CircuitBoard className={cls} />
    case 'design_note':         return <FileEdit className={cls} />
    case 'project_output':      return <FileCode2 className={cls} />
    default:                    return <File className={cls} />
  }
}

const EMBEDDING_BADGE: Record<
  EmbeddingStatus,
  { variant: 'success' | 'warning' | 'muted' | 'destructive'; icon: React.ReactNode }
> = {
  done:       { variant: 'success',     icon: <CheckCircle2 className="h-3 w-3" /> },
  processing: { variant: 'warning',     icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  pending:    { variant: 'muted',       icon: <Clock className="h-3 w-3" /> },
  error:      { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
}

type SortKey = 'recent' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc'
type ScopeFilter = 'all' | 'project' | 'global'
type StatusFilter = 'all' | EmbeddingStatus
type TypeFilter = 'all' | DocumentType

// ── Sub-components ─────────────────────────────────────────────────────────

function DocRow({
  doc,
  onDelete,
  deletingId,
  t,
  tStatus,
  locale,
}: {
  doc: Document
  onDelete: (id: string) => void
  deletingId: string | null
  t: ReturnType<typeof useTranslations<'documents'>>
  tStatus: ReturnType<typeof useTranslations<'status'>>
  locale: string
}) {
  const [downloading, setDownloading] = useState(false)
  const embedding = EMBEDDING_BADGE[doc.embedding_status]

  const ext = /\.([a-z0-9]+)$/i.exec(doc.name ?? '')?.[1]?.toLowerCase()
  const scope = doc.project_id ? 'project' : 'global'

  // Get normative standard_code from metadata if type is normative
  const normCode =
    doc.type === 'normative' && doc.metadata
      ? (doc.metadata as { standard_code?: string }).standard_code
      : null

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { url } = await documentsApi.getDownloadUrl(doc.id)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      a.click()
    } finally {
      setDownloading(false)
    }
  }

  const handleOpen = async () => {
    const { url } = await documentsApi.getDownloadUrl(doc.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-muted-foreground/30 hover:bg-card/80 transition-colors">
      {/* Type icon */}
      <div className="h-9 w-9 rounded-md bg-secondary border border-border flex items-center justify-center shrink-0 text-muted-foreground">
        <TypeIcon type={doc.type} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
          {ext && (
            <span className="text-[10px] font-mono uppercase text-muted-foreground/70 shrink-0 px-1.5 py-0.5 rounded bg-muted">
              {ext}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-muted-foreground">
          {doc.source && (
            <span className="inline-flex items-center gap-1">
              {scope === 'global'
                ? <Globe className="h-2.5 w-2.5" />
                : <Folder className="h-2.5 w-2.5" />}
              {doc.source}
            </span>
          )}
          {doc.file_size_bytes != null && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="tabular-nums">{formatFileSize(doc.file_size_bytes)}</span>
            </>
          )}
          <span className="text-muted-foreground/40">·</span>
          <span>{formatRelativeDate(doc.created_at, locale)}</span>
          {normCode && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-mono text-foreground/80">{normCode}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant={embedding.variant} className="gap-1 text-[10px]">
          {embedding.icon}
          {tStatus(doc.embedding_status)}
        </Badge>

        <div className="flex items-center gap-0.5 ml-1">
          <button
            title={t('download')}
            onClick={handleDownload}
            disabled={downloading}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            {downloading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
          </button>
          <button
            title={t('openNewTab')}
            onClick={handleOpen}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            title="Delete"
            onClick={() => onDelete(doc.id)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Group({
  type,
  docs,
  open,
  onToggle,
  label,
  onDelete,
  deletingId,
  t,
  tStatus,
  locale,
}: {
  type: DocumentType
  docs: Document[]
  open: boolean
  onToggle: () => void
  label: string
  onDelete: (id: string) => void
  deletingId: string | null
  t: ReturnType<typeof useTranslations<'documents'>>
  tStatus: ReturnType<typeof useTranslations<'status'>>
  locale: string
}) {
  return (
    <section className="space-y-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-1.5 text-left group/header"
      >
        <span className="text-muted-foreground group-hover/header:text-foreground transition-colors">
          {open
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <TypeIcon
          type={type}
          className="h-3.5 w-3.5 text-muted-foreground group-hover/header:text-foreground transition-colors"
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover/header:text-foreground transition-colors">
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground/60 font-medium">
          {docs.length}
        </span>
        <span className="flex-1 h-px ml-2 bg-border" />
      </button>
      {open && (
        <div className="space-y-1.5 animate-fade-in">
          {docs.map((d) => (
            <DocRow
              key={d.id}
              doc={d}
              onDelete={onDelete}
              deletingId={deletingId}
              t={t}
              tStatus={tStatus}
              locale={locale}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface DocumentListProps {
  documents: Document[]
  isLoading: boolean
  queryKey: string[]
  projectId?: string
  projectName?: string
}

export function DocumentList({
  documents,
  isLoading,
  queryKey,
  projectId,
  projectName,
}: DocumentListProps) {
  const t = useTranslations('documents')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const queryClient = useQueryClient()

  // ── Filter / sort state ──
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('recent')

  // ── Group open state ──
  const [openGroups, setOpenGroups] = useState<Record<DocumentType, boolean>>(() =>
    Object.fromEntries(DOC_TYPES.map((t) => [t, true])) as Record<DocumentType, boolean>
  )

  // ── Modal / delete state ──
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      setConfirmId(null)
      queryClient.invalidateQueries({ queryKey })
    },
    onSettled: () => setDeletingId(null),
  })

  const handleDeleteConfirm = (id: string) => {
    setDeletingId(id)
    deleteMutation.mutate(id)
  }

  // ── Filtered + sorted data ──
  const { groups, totalFiltered } = useMemo(() => {
    const q = search.trim().toLowerCase()

    const filtered = documents.filter((doc) => {
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false
      const docScope = doc.project_id ? 'project' : 'global'
      if (scopeFilter !== 'all' && docScope !== scopeFilter) return false
      if (statusFilter !== 'all' && doc.embedding_status !== statusFilter) return false
      if (!q) return true
      const meta = doc.metadata as Record<string, string> | null
      const haystack = [
        doc.name,
        doc.source ?? '',
        doc.type,
        meta?.standard_code,
        meta?.issuing_body,
        meta?.scope_summary,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })

    const comparators: Record<SortKey, (a: Document, b: Document) => number> = {
      recent:    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      oldest:    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      name_asc:  (a, b) => a.name.localeCompare(b.name),
      name_desc: (a, b) => b.name.localeCompare(a.name),
      size_desc: (a, b) => (b.file_size_bytes ?? 0) - (a.file_size_bytes ?? 0),
      size_asc:  (a, b) => (a.file_size_bytes ?? 0) - (b.file_size_bytes ?? 0),
    }
    filtered.sort(comparators[sort])

    const gmap = Object.fromEntries(DOC_TYPES.map((t) => [t, [] as Document[]])) as Record<DocumentType, Document[]>
    for (const doc of filtered) {
      gmap[doc.type].push(doc)
    }

    return { groups: gmap, totalFiltered: filtered.length }
  }, [documents, search, typeFilter, scopeFilter, statusFilter, sort])

  const activeFilterCount = [
    typeFilter !== 'all',
    scopeFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length

  const anyGroupOpen = Object.values(openGroups).some(Boolean)

  const clearFilters = useCallback(() => {
    setSearch('')
    setTypeFilter('all')
    setScopeFilter('all')
    setStatusFilter('all')
  }, [])

  const toggleAllGroups = () => {
    const next = !anyGroupOpen
    setOpenGroups(Object.fromEntries(DOC_TYPES.map((t) => [t, next])) as Record<DocumentType, boolean>)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const hasFilter = !!search || activeFilterCount > 0

  return (
    <>
      <div className="space-y-4">
        {/* ── Toolbar ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder={t('allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                {DOC_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Scope filter */}
            <Select value={scopeFilter} onValueChange={(v) => setScopeFilter(v as ScopeFilter)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder={t('allScopes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allScopes')}</SelectItem>
                <SelectItem value="project">{t('scopeProject')}</SelectItem>
                <SelectItem value="global">{t('scopeGlobal')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder={tStatus('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tStatus('status')}</SelectItem>
                <SelectItem value="done">{tStatus('done')}</SelectItem>
                <SelectItem value="processing">{tStatus('processing')}</SelectItem>
                <SelectItem value="pending">{tStatus('pending')}</SelectItem>
                <SelectItem value="error">{tStatus('error')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[160px] h-9">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t('sortRecent')}</SelectItem>
                <SelectItem value="oldest">{t('sortOldest')}</SelectItem>
                <SelectItem value="name_asc">{t('sortNameAsc')}</SelectItem>
                <SelectItem value="name_desc">{t('sortNameDesc')}</SelectItem>
                <SelectItem value="size_desc">{t('sortSizeDesc')}</SelectItem>
                <SelectItem value="size_asc">{t('sortSizeAsc')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Upload button */}
            <Button onClick={() => setUploadOpen(true)} className="gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              {t('upload')}
            </Button>
          </div>

          {/* Result summary */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {t('showing', { filtered: totalFiltered, total: documents.length })}
              {activeFilterCount > 0 && (
                <>
                  {' · '}
                  <button onClick={clearFilters} className="text-primary hover:underline">
                    {t('clearFilters', { count: activeFilterCount })}
                  </button>
                </>
              )}
            </span>
          </div>
        </div>

        {/* ── Library header ── */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">{t('library')}</h2>
          <button
            onClick={toggleAllGroups}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {anyGroupOpen ? t('collapseAll') : t('expandAll')}
          </button>
        </div>

        {/* ── Grouped list / empty state ── */}
        {totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-3 rounded-lg border border-dashed border-border bg-card/30">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {hasFilter
                ? <Search className="h-5 w-5" />
                : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {hasFilter ? t('noMatch') : t('noDocuments')}
              </p>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-sm">
                {hasFilter ? t('noMatchDesc') : t('emptyDesc')}
              </p>
            </div>
            {hasFilter ? (
              <Button size="sm" variant="outline" onClick={clearFilters}>
                {t('clearFilters', { count: activeFilterCount })}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setUploadOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                {t('uploadFirst')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5 pb-8">
            {DOC_TYPES.map((type) =>
              groups[type].length > 0 ? (
                <Group
                  key={type}
                  type={type}
                  docs={groups[type]}
                  open={openGroups[type]}
                  onToggle={() =>
                    setOpenGroups((o) => ({ ...o, [type]: !o[type] }))
                  }
                  label={t(type)}
                  onDelete={setConfirmId}
                  deletingId={deletingId}
                  t={t}
                  tStatus={tStatus}
                  locale={locale}
                />
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={projectId}
        projectName={projectName}
        queryKey={queryKey}
      />

      {/* Delete confirmation */}
      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm')}</DialogTitle>
            <DialogDescription>{t('deleteDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirmId && handleDeleteConfirm(confirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {tCommon('delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] Replace `components/documents/DocumentList.tsx` with the content above
- [ ] Commit: `git add components/documents/DocumentList.tsx && git commit -m "feat(documents): redesign DocumentList with toolbar, grouped types, download/open actions"`

---

## Task 4: Update `projects/[id]/page.tsx`

**Files:**
- Modify: `src/app/[locale]/(dashboard)/projects/[id]/page.tsx`

The documents tab currently renders a two-section layout with inline upload + list. Replace it with the new self-contained `DocumentList` component (which owns the upload modal internally).

Also remove the `DocumentUpload` import, the `Separator` import if not used elsewhere, and the `tDocuments('upload')` label.

- [ ] In `src/app/[locale]/(dashboard)/projects/[id]/page.tsx`:

**Remove** line 13: `import { DocumentUpload } from '@/components/documents/DocumentUpload'`

**Check** if `Separator` is used outside the documents tab. If it is ONLY in the documents tab, remove it. If used elsewhere, keep it.

**Replace** the documents tab content (lines 157–178):

```tsx
{/* Documents tab */}
<TabsContent value="documents" className="flex-1 overflow-y-auto p-6 mt-0">
  <DocumentList
    documents={documents ?? []}
    isLoading={docsLoading}
    queryKey={['documents', id]}
    projectId={id}
    projectName={project?.name}
  />
</TabsContent>
```

Also remove the `tDocuments` translation hook if it is no longer needed anywhere in the page (check all uses first — the tab trigger still reads `tDocuments('title')`), so keep the hook but remove `tDocuments('upload')` usage.

- [ ] Apply the changes above
- [ ] Verify the file still compiles: `npx tsc --noEmit`
- [ ] Commit: `git add "src/app/[locale]/(dashboard)/projects/[id]/page.tsx" && git commit -m "refactor(documents): simplify project page documents tab to use new DocumentList"`

---

## Task 5: Update `knowledge-base/page.tsx`

**Files:**
- Modify: `src/app/[locale]/(dashboard)/knowledge-base/page.tsx`

Apply the same pattern: remove the inline `DocumentUpload` section and replace with the self-contained `DocumentList`.

- [ ] Replace the full content of `src/app/[locale]/(dashboard)/knowledge-base/page.tsx` with:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { DocumentList } from '@/components/documents/DocumentList'

const QUERY_KEY = ['documents-global']

export default function KnowledgeBasePage() {
  const t = useTranslations('knowledgeBase')

  const { data: documents, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => documentsApi.list(), // no project_id = global docs
  })

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Header title={t('title')} description={t('description')} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <DocumentList
            documents={documents ?? []}
            isLoading={isLoading}
            queryKey={QUERY_KEY}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] Apply the change
- [ ] Verify: `npx tsc --noEmit`
- [ ] Commit: `git add "src/app/[locale]/(dashboard)/knowledge-base/page.tsx" && git commit -m "refactor(knowledge-base): use new self-contained DocumentList"`

---

## Task 6: Delete `DocumentUpload.tsx`

**Files:**
- Delete: `components/documents/DocumentUpload.tsx`

Now that both consumers (project page and knowledge-base page) use `DocumentList` with its built-in modal, the old inline `DocumentUpload` is unreferenced.

- [ ] Verify it is no longer imported anywhere:
  ```bash
  grep -r "DocumentUpload" components/ src/ --include="*.tsx" --include="*.ts"
  ```
  Expected: only the file itself shows up (or nothing if already gone). If anything else imports it, fix that first.

- [ ] Delete the file:
  ```bash
  rm "components/documents/DocumentUpload.tsx"
  ```

- [ ] Commit:
  ```bash
  git add -A && git commit -m "chore(documents): remove DocumentUpload (replaced by DocumentUploadModal)"
  ```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|-------------|------|
| Documents grouped by type (7 groups) | Task 3 — `Group` + `DOC_TYPES` array |
| Download button per doc | Task 3 — `handleDownload` in `DocRow` using `getDownloadUrl` |
| Open in new tab per doc | Task 3 — `handleOpen` in `DocRow` |
| Search by name/source/standard code | Task 3 — `useMemo` filter with haystack |
| Type filter | Task 3 — `typeFilter` state + Select |
| Scope filter (project/global) | Task 3 — `scopeFilter` derived from `doc.project_id` |
| Status filter | Task 3 — `statusFilter` state + Select |
| Sort (6 options) | Task 3 — `sort` state + comparators |
| Upload → single button → modal | Task 2 + Task 3 — `DocumentUploadModal` opened by `Plus` button |
| Normative conditional fields | Task 2 — `isNormative` block |
| Collapse/expand all groups | Task 3 — `toggleAllGroups` |
| Empty states (no docs / no match) | Task 3 — conditional render |
| Result count + clear filters | Task 3 — `t('showing', …)` + clear button |
| Knowledge base updated | Task 5 |
| `getDownloadUrl` API | Task 1 |
| Normative metadata in upload API | Task 1 |
| i18n keys | Task 1 |

All requirements covered. No placeholders or TBDs.
