'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { usePathname, useRouter } from '@/i18n/routing'
import { runsApi } from '@/lib/api'

const EDITOR_PARAM = 'editor'

/**
 * Whether the architecture page shows the diagram editor (design 5a), kept in
 * the URL as `?editor=<runId>` so it survives a reload and the back button
 * closes it. The top bar and the project layout read it too.
 */
export function useArchitectureEditor() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // /projects/{id}/pipeline/architecture_agent
  const [, , projectId, tab, phaseId] = pathname.split('/')
  const onArchitecturePage = tab === 'pipeline' && phaseId === 'architecture_agent'
  const editorRunId = onArchitecturePage ? searchParams.get(EDITOR_PARAM) : null

  const openEditor = useCallback(
    (runId: string) => router.push(`${pathname}?${EDITOR_PARAM}=${encodeURIComponent(runId)}`, { scroll: false }),
    [router, pathname]
  )
  const closeEditor = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname])

  return {
    projectId: onArchitecturePage ? projectId : null,
    editorRunId,
    isEditorOpen: !!editorRunId,
    openEditor,
    closeEditor,
  }
}

/**
 * Mints a fresh editor link and opens it in a new tab. The token carries the
 * project/run scope, so the tab keeps working even if this one is closed.
 */
export function useOpenEditorInNewTab(projectId: string | null, runId: string | null) {
  return useMutation({
    mutationFn: () => runsApi.getEditorLink(projectId!, 'architecture_agent', runId!),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener')
    },
  })
}
