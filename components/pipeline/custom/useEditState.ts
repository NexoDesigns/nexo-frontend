import { useState, useEffect, useRef, useCallback } from 'react'

type EditState = 'idle' | 'editing' | 'saving'

export function useEditState(
  initialData: Record<string, unknown>,
  onSave: (data: Record<string, unknown>) => Promise<void>,
  containerRef: React.RefObject<HTMLElement>
) {
  const [state, setState] = useState<EditState>('idle')
  const [draft, setDraft] = useState<Record<string, unknown>>(initialData)
  const [error, setError] = useState<string | null>(null)

  // Keep draft in sync if item data changes externally (e.g. after save)
  useEffect(() => {
    if (state === 'idle') {
      setDraft(initialData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData), state])

  const commitSave = useCallback(async () => {
    if (state !== 'editing') return
    setState('saving')
    setError(null)
    try {
      await onSave(draft)
      setState('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
      setState('editing')
    }
  }, [state, draft, onSave])

  const startEdit = useCallback(() => {
    setDraft(initialData)
    setError(null)
    setState('editing')
  }, [initialData])

  const cancelEdit = useCallback(() => {
    setDraft(initialData)
    setError(null)
    setState('idle')
  }, [initialData])

  // Outside-click → save
  useEffect(() => {
    if (state !== 'editing') return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        commitSave()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [state, commitSave, containerRef])

  // Escape → cancel
  useEffect(() => {
    if (state !== 'editing') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelEdit()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [state, cancelEdit])

  const updateField = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    state,
    draft,
    error,
    isEditing: state === 'editing',
    isSaving: state === 'saving',
    startEdit,
    cancelEdit,
    commitSave,
    updateField,
    setDraft,
  }
}