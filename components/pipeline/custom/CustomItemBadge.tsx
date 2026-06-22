'use client'

import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface CustomItemBadgeProps {
  sourceLabel: string
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onDelete?: () => void
  className?: string
}

export function CustomItemBadge({
  sourceLabel,
  isEditing,
  isSaving,
  onEdit,
  onDelete,
  className,
}: CustomItemBadgeProps) {
  const t = useTranslations('pipeline')
  return (
    <div className={cn('flex items-center justify-between gap-2 mb-2', className)}>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
          {t('customOutputBadge')}
        </span>
        <span
          className="text-[10px] text-muted-foreground/60 truncate max-w-[160px]"
          title={t('customOutputSource', { label: sourceLabel })}
        >
          {t('customOutputSource', { label: sourceLabel })}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className={cn(
              'p-0.5 rounded text-muted-foreground/50 hover:text-foreground transition-colors',
              isEditing && 'text-primary'
            )}
            title={t('editCustomOutput')}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
        {onDelete && !isSaving && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-0.5 rounded text-muted-foreground/50 hover:text-destructive transition-colors"
            title={t('deleteCustomOutput')}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}