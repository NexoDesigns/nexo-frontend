import { useEffect } from 'react'

/** Calls `onDismiss` on a mousedown outside every given element, or on Escape. */
export function useDismiss(
  refs: React.RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (refs.some((r) => r.current?.contains(target))) return
      onDismiss()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onDismiss])
}
