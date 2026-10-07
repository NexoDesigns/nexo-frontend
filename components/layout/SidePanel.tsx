'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PanelRightClose } from 'lucide-react'
import { SIDE_PANEL } from '@/lib/design-constants'
import { cn } from '@/lib/utils'

interface SidePanelProps {
  /** Remembers this panel's width and hidden state per browser */
  storageKey: string
  title: React.ReactNode
  headerActions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

interface StoredPanel {
  w?: number
  folded?: boolean
}

function readStored(key: string): StoredPanel {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') as StoredPanel
  } catch {
    return {}
  }
}

function writeStored(key: string, value: StoredPanel) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

// Layout effect in the browser (no flash at the stored size), plain effect during SSR
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const maxWidth = () =>
  Math.max(SIDE_PANEL.minWidth, Math.round(window.innerWidth * SIDE_PANEL.maxWidthFraction))

const clampWidth = (w: number) => Math.max(SIDE_PANEL.minWidth, Math.min(Math.round(w), maxWidth()))

/**
 * A panel docked on the right of a page (same mechanics as
 * nexo-design-pipeline's side-panel.js):
 * - drag its left edge to resize; released almost closed, it hides;
 * - the button in its header hides it;
 * - hidden, hovering the middle of the screen's right edge shows a line that
 *   brings it back. A hidden panel can't be dragged, so the two gestures
 *   never conflict.
 * Width and hidden state persist in localStorage under `storageKey`.
 */
export function SidePanel({ storageKey, title, headerActions, children, className }: SidePanelProps) {
  const t = useTranslations('common')
  const key = SIDE_PANEL.storagePrefix + storageKey
  const [width, setWidth] = useState<number>(SIDE_PANEL.defaultWidth)
  const [folded, setFolded] = useState(false)
  // No width transition until the stored state is applied, and while dragging
  const [instant, setInstant] = useState(true)
  const asideRef = useRef<HTMLElement>(null)
  const widthRef = useRef(width)
  widthRef.current = width

  // Restore before paint: the panel opens the way the user left it
  useIsomorphicLayoutEffect(() => {
    const stored = readStored(key)
    if (Number(stored.w) > 0) setWidth(clampWidth(Number(stored.w)))
    setFolded(!!stored.folded)
    const frame = requestAnimationFrame(() => setInstant(false))
    return () => cancelAnimationFrame(frame)
  }, [key])

  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const setFold = useCallback(
    (next: boolean) => {
      setFolded(next)
      writeStored(key, { w: widthRef.current, folded: next })
    },
    [key]
  )

  const onGripPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const grip = e.currentTarget
    grip.setPointerCapture(e.pointerId)
    const startWidth = widthRef.current
    const right = asideRef.current?.getBoundingClientRect().right ?? window.innerWidth
    let last = startWidth
    setInstant(true)

    const move = (ev: PointerEvent) => {
      // Below the minimum is allowed mid-drag: it previews the fold gesture
      last = Math.max(0, Math.min(Math.round(right - ev.clientX), maxWidth()))
      setWidth(last)
    }
    const up = () => {
      grip.removeEventListener('pointermove', move)
      grip.removeEventListener('pointerup', up)
      grip.removeEventListener('pointercancel', up)
      setInstant(false)
      const released = last
      if (released < SIDE_PANEL.collapseWidth) {
        const restored = clampWidth(startWidth)
        setWidth(restored)
        widthRef.current = restored
        setFold(true)
      } else {
        const next = clampWidth(released)
        setWidth(next)
        writeStored(key, { w: next, folded: false })
      }
    }
    grip.addEventListener('pointermove', move)
    grip.addEventListener('pointerup', up)
    grip.addEventListener('pointercancel', up)
  }

  const panelWidth = `${width}px`

  return (
    <div className="relative flex shrink-0">
      <aside
        ref={asideRef}
        aria-hidden={folded}
        className={cn(
          'flex flex-col overflow-hidden border-l border-border bg-sidebar',
          folded && 'border-l-0',
          className
        )}
        style={{
          width: folded ? 0 : panelWidth,
          transition: instant ? 'none' : `width ${SIDE_PANEL.transitionMs}ms ease`,
        }}
      >
        {/* Content keeps its width while folding, so it slides out instead of re-wrapping */}
        <div className="flex h-full min-h-0 flex-col" style={{ width: panelWidth, minWidth: panelWidth }}>
          <div className="flex shrink-0 items-center gap-1 pb-2 pl-4 pr-2 pt-3.5">
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">{title}</span>
            {headerActions}
            <button
              type="button"
              onClick={() => setFold(true)}
              title={t('hidePanel')}
              aria-label={t('hidePanel')}
              className="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-4">{children}</div>
        </div>
      </aside>

      {/* Resize grip on the panel's edge — only while it is shown */}
      {!folded && (
        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={onGripPointerDown}
          className="group absolute inset-y-0 left-0 z-10 cursor-ew-resize"
          style={{ width: SIDE_PANEL.dividerWidth }}
        >
          <span className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-0 transition-opacity group-hover:opacity-50 group-active:opacity-80" />
        </div>
      )}

      {/* Hidden: the middle of the right edge reveals a line that reopens it */}
      {folded && (
        <div
          className="group absolute right-0 top-1/2 z-20 -translate-y-1/2"
          style={{ width: SIDE_PANEL.revealZoneWidth, height: SIDE_PANEL.revealZoneHeight }}
        >
          <button
            type="button"
            onClick={() => setFold(false)}
            title={t('showPanel')}
            aria-label={t('showPanel')}
            aria-expanded={false}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-[3px] bg-muted-foreground opacity-0 transition-[opacity,background-color] duration-150 hover:bg-primary hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-60"
            style={{ width: SIDE_PANEL.foldLineWidth, height: SIDE_PANEL.foldLineHeight }}
          />
        </div>
      )}
    </div>
  )
}
