'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { runsApi } from '@/lib/api'
import { gatedUrl } from '@/lib/gate'
import { Skeleton } from '@/components/ui/skeleton'

interface ArchitectureEditorFrameProps {
  projectId: string
  runId: string
  onApproved: () => void
}

/**
 * The System Diagram App (architecture-editor) for one architecture_agent run,
 * embedded in the page's center (design 5a).
 */
export function ArchitectureEditorFrame({ projectId, runId, onApproved }: ArchitectureEditorFrameProps) {
  const t = useTranslations('pipeline')

  // A fresh link is minted every time the editor opens — the token is short-lived (8h)
  // and scoped to this run, so there is no reason to cache it across sessions.
  const { data: link, isLoading, isError } = useQuery({
    queryKey: ['editor-link', projectId, runId],
    queryFn: () => runsApi.getEditorLink(projectId, 'architecture_agent', runId),
    staleTime: 0,
  })

  const onApprovedRef = useRef(onApproved)
  onApprovedRef.current = onApproved

  // Best-effort only: the embedded editor can postMessage 'nexo:approved' to
  // close itself instantly. Opening in a new tab has no such signal — the
  // page picks up the change on its own via polling/refetch-on-focus.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'nexo:approved') onApprovedRef.current()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#161A20]">
      {isLoading && (
        <div className="flex-1 p-6">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      {isError && (
        <div className="flex flex-1 items-center justify-center text-sm text-destructive">
          {t('architectureDiagramLoadError')}
        </div>
      )}
      {link && (
        <iframe
          src={gatedUrl(link.url)}
          className="h-full w-full flex-1 border-0"
          title={t('architectureDiagramTitle')}
          allow="clipboard-read; clipboard-write"
        />
      )}
    </div>
  )
}
