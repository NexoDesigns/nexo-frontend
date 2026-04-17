'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { normativesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectNormative, ProjectNormativeStatus, NormativeDocument } from '@/types'

interface NormativesSearchPanelProps {
  projectId: string
  projectNormatives: ProjectNormative[]
}

export function NormativesSearchPanel({
  projectId,
  projectNormatives,
}: NormativesSearchPanelProps) {
  const t = useTranslations('normativas')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: allNormatives, isLoading: searchLoading } = useQuery({
    queryKey: ['normatives-list'],
    queryFn: () => normativesApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: (normatives: Array<{ document_id: string; status: ProjectNormativeStatus }>) =>
      normativesApi.updateProjectNormatives(projectId, { normatives }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-normatives', projectId] })
    },
  })

  const taggedIds = new Set(projectNormatives.map((n) => n.document_id))

  const searchResults = (allNormatives ?? []).filter((doc) => {
    if (taggedIds.has(doc.id)) return false
    if (!debouncedQuery.trim()) return false
    const q = debouncedQuery.toLowerCase()
    return (
      doc.metadata.standard_code.toLowerCase().includes(q) ||
      doc.metadata.scope_summary?.toLowerCase().includes(q) ||
      doc.metadata.issuing_body.toLowerCase().includes(q)
    )
  })

  function buildPayload(
    documentId: string,
    status: ProjectNormativeStatus
  ): Array<{ document_id: string; status: ProjectNormativeStatus }> {
    const existing = projectNormatives
      .filter((n) => n.document_id !== documentId)
      .map((n) => ({ document_id: n.document_id, status: n.status }))
    return [...existing, { document_id: documentId, status }]
  }

  function removePayload(
    documentId: string
  ): Array<{ document_id: string; status: ProjectNormativeStatus }> {
    return projectNormatives
      .filter((n) => n.document_id !== documentId)
      .map((n) => ({ document_id: n.document_id, status: n.status }))
  }

  const handleAdd = (doc: NormativeDocument, status: ProjectNormativeStatus) => {
    updateMutation.mutate(buildPayload(doc.id, status))
    setSearchQuery('')
    setShowResults(false)
  }

  const handleRemove = (documentId: string) => updateMutation.mutate(removePayload(documentId))
  const handleRestore = (documentId: string) => updateMutation.mutate(buildPayload(documentId, 'confirmed'))

  const confirmed = projectNormatives.filter((n) => n.status === 'confirmed')
  const discarded = projectNormatives.filter((n) => n.status === 'not_applicable')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div ref={searchRef} className="relative p-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            placeholder={t('searchPlaceholder')}
            className="pl-8 text-xs h-8"
          />
        </div>

        {/* Search dropdown */}
        {showResults && searchQuery.trim() && (
          <div className="absolute left-3 right-3 top-full mt-1 z-20 rounded-md border border-border bg-card shadow-lg max-h-56 overflow-y-auto">
            {searchLoading ? (
              <div className="p-3 space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground text-center">
                {tCommon('noResults')}
              </p>
            ) : (
              searchResults.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-medium truncate">
                      {doc.metadata.standard_code}
                    </p>
                    {doc.metadata.scope_summary && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {doc.metadata.scope_summary}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title={t('addAsConfirmed')}
                      onClick={() => handleAdd(doc, 'confirmed')}
                    >
                      <Plus className="h-3 w-3 text-success" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title={t('markAsNotApplicable')}
                      onClick={() => handleAdd(doc, 'not_applicable')}
                    >
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Confirmed */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            {t('activeNormatives')}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
              {confirmed.length}
            </span>
          </p>

          {confirmed.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t('noneConfirmed')}</p>
          ) : (
            <div className="space-y-1">
              {confirmed.map((n) => (
                <NormativeRow
                  key={n.document_id}
                  normative={n}
                  status="confirmed"
                  onAction={() => handleRemove(n.document_id)}
                  actionIcon={<Trash2 className="h-3 w-3" />}
                  actionTitle={t('remove')}
                  confirmedLabel={t('confirmed')}
                  discardedLabel={t('discarded')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Not applicable */}
        {discarded.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              {t('notApplicableSection')}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                {discarded.length}
              </span>
            </p>

            <div className="space-y-1">
              {discarded.map((n) => (
                <NormativeRow
                  key={n.document_id}
                  normative={n}
                  status="not_applicable"
                  onAction={() => handleRestore(n.document_id)}
                  actionIcon={<RotateCcw className="h-3 w-3" />}
                  actionTitle={t('restore')}
                  confirmedLabel={t('confirmed')}
                  discardedLabel={t('discarded')}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row component ────────────────────────────────────────────────────────────

interface NormativeRowProps {
  normative: ProjectNormative
  status: ProjectNormativeStatus
  onAction: () => void
  actionIcon: React.ReactNode
  actionTitle: string
  confirmedLabel: string
  discardedLabel: string
}

function NormativeRow({
  normative,
  status,
  onAction,
  actionIcon,
  actionTitle,
  confirmedLabel,
  discardedLabel,
}: NormativeRowProps) {
  const code =
    normative.document?.metadata.standard_code ?? normative.document_id.slice(0, 8)

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-md border px-3 py-2 group',
        status === 'confirmed'
          ? 'border-success/30 bg-success/5'
          : 'border-border bg-muted/30 opacity-70'
      )}
    >
      {status === 'confirmed' ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-medium truncate">{code}</p>
      </div>

      <Badge
        variant={status === 'confirmed' ? 'success' : 'muted'}
        className="text-[9px] uppercase tracking-wide shrink-0"
      >
        {status === 'confirmed' ? confirmedLabel : discardedLabel}
      </Badge>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title={actionTitle}
        onClick={onAction}
      >
        {actionIcon}
      </Button>
    </div>
  )
}
