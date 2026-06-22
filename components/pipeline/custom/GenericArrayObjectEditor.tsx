'use client'

import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface GenericArrayObjectEditorProps {
  label: string
  items: Record<string, unknown>[]
  onChange: (items: Record<string, unknown>[]) => void
  className?: string
}

export function GenericArrayObjectEditor({
  label,
  items,
  onChange,
  className,
}: GenericArrayObjectEditorProps) {
  const t = useTranslations('pipeline')

  // Capture field keys from the first render so they survive if user empties the list
  const templateRef = useRef<Record<string, unknown>>(
    items[0]
      ? Object.fromEntries(Object.keys(items[0]).map((k) => [k, '']))
      : {}
  )

  const fieldKeys = Object.keys(templateRef.current)

  const update = (i: number, field: string, val: string) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  const add = () => onChange([...items, { ...templateRef.current }])

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </p>

      {items.map((item, i) => (
        <div
          key={i}
          className="rounded border border-border/50 bg-muted/20 px-2 py-2 space-y-1.5"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground/60 font-mono">#{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-muted-foreground/40 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {fieldKeys.map((field) => {
            const val = String(item[field] ?? '')
            const isLong = val.length > 60
            return (
              <div key={field}>
                <p className="text-[10px] text-muted-foreground/60 mb-0.5">{field}</p>
                {isLong ? (
                  <Textarea
                    value={val}
                    onChange={(e) => update(i, field, e.target.value)}
                    placeholder={field}
                    className="text-[11px] min-h-[50px]"
                  />
                ) : (
                  <Input
                    value={val}
                    onChange={(e) => update(i, field, e.target.value)}
                    placeholder={field}
                    className="text-[11px] h-6"
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
      >
        <Plus className="h-2.5 w-2.5" /> {t('addItem')}
      </button>
    </div>
  )
}