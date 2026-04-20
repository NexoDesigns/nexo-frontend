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
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NormativeDocument } from '@/types'

interface NormativesSearchPanelProps {
  projectId: string
  projectNormatives: NormativeDocument[]
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
    mutationFn: (document_ids: string[]) =>
      normativesApi.updateProjectNormatives(projectId, { document_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-normatives', projectId] })
    },
  })

  // All returned normatives are confirmed (backend only returns confirmed ones)
  const confirmedIds = projectNormatives.map((n) => n.id)
  const taggedIds = new Set(confirmedIds)

  const searchResults = (allNormatives ?? []).filter((doc) => {
    if (taggedIds.has(doc.id)) return false
    if (!debouncedQuery.trim()) return false
    const q = debouncedQuery.toLowerCase()
    const meta = doc.metadata
    if (!meta) return doc.name.toLowerCase().includes(q)
    return (
      meta.standard_code?.toLowerCase().includes(q) ||
      meta.scope_summary?.toLowerCase().includes(q) ||
      meta.issuing_body?.toLowerCase().includes(q)
    ) ?? false
  })

  const handleAdd = (doc: NormativeDocument) => {
    updateMutation.mutate([...confirmedIds, doc.id])
    setSearchQuery('')
    setShowResults(false)
  }

  const handleRemove = (id: string) =>
    updateMutation.mutate(confirmedIds.filter((cid) => cid !== id))

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
                      {doc.metadata?.standard_code ?? doc.name}
                    </p>
                    {doc.metadata?.scope_summary && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {doc.metadata.scope_summary}
                      </p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    title={t('addAsConfirmed')}
                    onClick={() => handleAdd(doc)}
                  >
                    <Plus className="h-3 w-3 text-success" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirmed list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {t('activeNormatives')}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
            {projectNormatives.length}
          </span>
        </p>

        {projectNormatives.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t('noneConfirmed')}</p>
        ) : (
          <div className="space-y-1">
            {projectNormatives.map((n) => (
              <NormativeRow
                key={n.id}
                normative={n}
                onRemove={() => handleRemove(n.id)}
                removeTitle={t('remove')}
                confirmedLabel={t('confirmed')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row component ────────────────────────────────────────────────────────────

interface NormativeRowProps {
  normative: NormativeDocument
  onRemove: () => void
  removeTitle: string
  confirmedLabel: string
}

function NormativeRow({ normative, onRemove, removeTitle, confirmedLabel }: NormativeRowProps) {
  const code = normative.metadata?.standard_code ?? normative.name

  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-md border px-3 py-2 group',
      'border-success/30 bg-success/5'
    )}>
      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-medium truncate">{code}</p>
      </div>

      <Badge variant="success" className="text-[9px] uppercase tracking-wide shrink-0">
        {confirmedLabel}
      </Badge>

      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title={removeTitle}
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}
