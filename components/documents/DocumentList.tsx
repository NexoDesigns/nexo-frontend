'use client'

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
import { formatRelativeDate, formatFileSize } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import {
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import type { Document, EmbeddingStatus } from '@/types'
import { cn } from '@/lib/utils'

interface DocumentListProps {
  documents: Document[]
  isLoading: boolean
  queryKey: string[]
}

const EMBEDDING_BADGE: Record<
  EmbeddingStatus,
  { variant: 'success' | 'warning' | 'muted' | 'destructive'; icon: React.ReactNode }
> = {
  done: { variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  processing: { variant: 'warning', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  pending: { variant: 'muted', icon: <Clock className="h-3 w-3" /> },
  error: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
}

export function DocumentList({ documents, isLoading, queryKey }: DocumentListProps) {
  const t = useTranslations('documents')
  const locale = useLocale()
  const queryClient = useQueryClient()
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

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteMutation.mutate(id)
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

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{t('noDocuments')}</p>
        <p className="text-xs text-muted-foreground/60">{t('uploadFirst')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1.5">
        {documents.map((doc) => {
          const embedding = EMBEDDING_BADGE[doc.embedding_status]
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 group"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="muted" className="text-[10px] px-1.5 py-0">
                    {t(doc.type)}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatFileSize(doc.file_size_bytes)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(doc.created_at, locale)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={embedding.variant} className="gap-1 text-[10px]">
                  {embedding.icon}
                  {t(doc.embedding_status)}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmId(doc.id)}
                  disabled={deletingId === doc.id}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm')}</DialogTitle>
            <DialogDescription>{t('deleteDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirmId && handleDelete(confirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
