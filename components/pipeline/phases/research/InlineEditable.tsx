'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface InlineEditableProps {
  value: string
  placeholder: string
  onSave: (value: string) => void
  /** Called whenever editing ends (saved, unchanged or cancelled) */
  onDone?: () => void
  multiline?: boolean
  /** Open in edit mode on mount (e.g. a just-created item) */
  autoEdit?: boolean
  className?: string
  inputClassName?: string
}

/**
 * Text that turns into a field on double-click (design 4a): Enter or blur
 * saves, Escape cancels. Clicks inside the field don't reach the row below.
 */
export function InlineEditable({
  value,
  placeholder,
  onSave,
  onDone,
  multiline = false,
  autoEdit = false,
  className,
  inputClassName,
}: InlineEditableProps) {
  const t = useTranslations('pipeline')
  const [editing, setEditing] = useState(autoEdit)
  const cancelled = useRef(false)

  const finish = (next: string) => {
    setEditing(false)
    if (cancelled.current) {
      cancelled.current = false
    } else {
      const trimmed = multiline ? next : next.trim()
      if (trimmed !== value) onSave(trimmed)
    }
    onDone?.()
  }

  const fieldProps = {
    autoFocus: true,
    defaultValue: value,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => finish(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cancelled.current = true
        e.currentTarget.blur()
      } else if (e.key === 'Enter' && !multiline) {
        e.currentTarget.blur()
      }
    },
    className: cn(
      'box-border rounded border border-primary bg-sidebar text-foreground outline-none',
      inputClassName
    ),
  }

  if (editing) {
    return multiline ? <textarea rows={3} {...fieldProps} /> : <input type="text" {...fieldProps} />
  }

  return (
    <span
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      title={t('doubleClickToEdit')}
      className={cn('cursor-text', !value && 'text-[#6F7A8B]', className)}
    >
      {value || placeholder}
    </span>
  )
}
