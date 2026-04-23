'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { DOC_TYPES } from '@/lib/constants'
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
import type { Document, DocumentType, EmbeddingStatus, NormativeMetadata } from '@/types'
import { cn } from '@/lib/utils'
import { DocumentUploadModal } from './DocumentUploadModal'

// ── Icons ──────────────────────────────────────────────────────────────────

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

// ── Badge config ───────────────────────────────────────────────────────────

const EMBEDDING_BADGE: Record<
  EmbeddingStatus,
  { variant: 'success' | 'warning' | 'muted' | 'destructive'; icon: React.ReactNode }
> = {
  done:       { variant: 'success',     icon: <CheckCircle2 className="h-3 w-3" /> },
  processing: { variant: 'warning',     icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  pending:    { variant: 'muted',       icon: <Clock className="h-3 w-3" /> },
  error:      { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
}

// ── Types ──────────────────────────────────────────────────────────────────

type SortKey = 'recent' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc'
type ScopeFilter = 'all' | 'project' | 'global'
type StatusFilter = 'all' | EmbeddingStatus
type TypeFilter = 'all' | DocumentType

// ── DocRow ─────────────────────────────────────────────────────────────────

function DocRow({
  doc,
  onDelete,
  deletingId,
}: {
  doc: Document
  onDelete: (id: string) => void
  deletingId: string | null
}) {
  const t = useTranslations('documents')
  const tStatus = useTranslations('status')
  const locale = useLocale()
  const [downloading, setDownloading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const embedding = EMBEDDING_BADGE[doc.embedding_status]

  const ext = /\.([a-z0-9]+)$/i.exec(doc.name ?? '')?.[1]?.toLowerCase()
  const scope = doc.project_id ? 'project' : 'global'

  const normCode =
    doc.type === 'normative' && doc.metadata
      ? (doc.metadata as unknown as NormativeMetadata).standard_code ?? null
      : null

  const handleDownload = async () => {
    setDownloading(true)
    setActionError(null)
    try {
      const { url } = await documentsApi.getDownloadUrl(doc.id)
      // Fetch as blob so we get a same-origin object URL — the `download` attribute
      // is ignored by browsers for cross-origin URLs (e.g. Supabase signed URLs).
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      setActionError(t('uploadError'))
      setTimeout(() => setActionError(null), 3000)
    } finally {
      setDownloading(false)
    }
  }

  const handleOpen = async () => {
    setActionError(null)
    // Open the tab synchronously to avoid popup blockers. Do NOT pass 'noopener'
    // because that makes window.open return null, preventing us from navigating it.
    const newWindow = window.open('', '_blank')
    try {
      const { url } = await documentsApi.getDownloadUrl(doc.id)
      if (newWindow) {
        newWindow.location.href = url
      }
    } catch {
      newWindow?.close()
      setActionError(t('uploadError'))
      setTimeout(() => setActionError(null), 3000)
    }
  }

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-muted-foreground/30 hover:bg-card/80 transition-colors">
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
            title={t('deleteConfirm')}
            onClick={() => onDelete(doc.id)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {actionError && (
        <p className="absolute -bottom-5 right-0 text-[10px] text-destructive whitespace-nowrap">
          {actionError}
        </p>
      )}
    </div>
  )
}

// ── Group ──────────────────────────────────────────────────────────────────

function Group({
  type,
  docs,
  open,
  onToggle,
  label,
  onDelete,
  deletingId,
}: {
  type: DocumentType
  docs: Document[]
  open: boolean
  onToggle: () => void
  label: string
  onDelete: (id: string) => void
  deletingId: string | null
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
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('recent')

  const [openGroups, setOpenGroups] = useState<Record<DocumentType, boolean>>(() =>
    Object.fromEntries(DOC_TYPES.map((type) => [type, true])) as Record<DocumentType, boolean>
  )

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

    const gmap = Object.fromEntries(
      DOC_TYPES.map((type) => [type, [] as Document[]])
    ) as Record<DocumentType, Document[]>
    for (const doc of filtered) {
      gmap[doc.type].push(doc)
    }

    return { groups: gmap, totalFiltered: filtered.length }
  }, [documents, search, typeFilter, scopeFilter, statusFilter, sort])

  const activeFilterCount = [
    !!search,
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
    setOpenGroups(
      Object.fromEntries(DOC_TYPES.map((type) => [type, next])) as Record<DocumentType, boolean>
    )
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
        {/* Toolbar */}
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
                <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
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
          <div className="flex items-center text-[11px] text-muted-foreground">
            <span>
              {t('showing', { filtered: totalFiltered, total: documents.length })}
            </span>
            {activeFilterCount > 0 && (
              <>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <button onClick={clearFilters} className="text-primary hover:underline">
                  {t('clearFilters', { count: activeFilterCount })}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Library header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">{t('library')}</h2>
          <button
            onClick={toggleAllGroups}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {anyGroupOpen ? t('collapseAll') : t('expandAll')}
          </button>
        </div>

        {/* Grouped list / empty state */}
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
