'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ContextMenuItem {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect: () => void
  destructive?: boolean
}

interface SimpleContextMenuProps {
  open: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function SimpleContextMenu({ open, x, y, items, onClose }: SimpleContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}
      className="min-w-[140px] rounded-md border border-border bg-popover shadow-md py-1 animate-in fade-in-0 zoom-in-95"
    >
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => { onClose(); item.onSelect() }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors',
            item.destructive
              ? 'text-destructive hover:bg-destructive/10'
              : 'text-foreground hover:bg-accent'
          )}
        >
          {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  )
}
