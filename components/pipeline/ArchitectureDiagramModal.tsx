'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/skeleton'

interface ArchitectureDiagramModalProps {
  projectId: string
  runId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onApproved: () => void
}

/** Full-screen modal embedding the System Diagram App (architecture-editor) for one architecture_agent run. */
export function ArchitectureDiagramModal({
  projectId,
  runId,
  open,
  onOpenChange,
  onApproved,
}: ArchitectureDiagramModalProps) {
  const t = useTranslations('pipeline')

  // A fresh link is minted every time the modal opens — the token is short-lived (8h)
  // and scoped to this run, so there is no reason to cache it across sessions.
  const { data: link, isLoading, isError } = useQuery({
    queryKey: ['editor-link', projectId, runId],
    queryFn: () => runsApi.getEditorLink(projectId, 'architecture_agent', runId),
    enabled: open,
    staleTime: 0,
  })

  // Best-effort only: an iframe-embedded editor can postMessage 'nexo:approved' to
  // close this modal instantly. Opening in a new tab has no such signal — the
  // pipeline view picks up the change on its own via polling/refetch-on-focus.
  useEffect(() => {
    if (!open) return
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'nexo:approved') {
        onApproved()
        onOpenChange(false)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [open, onApproved, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[96vw] h-[94vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{t('architectureDiagramTitle')}</DialogTitle>
        {isLoading && (
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full" />
          </div>
        )}
        {isError && (
          <div className="flex-1 flex items-center justify-center text-sm text-destructive">
            {t('architectureDiagramLoadError')}
          </div>
        )}
        {link && (
          <iframe
            src={link.url}
            className="w-full h-full border-0"
            title="System Diagram App"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}