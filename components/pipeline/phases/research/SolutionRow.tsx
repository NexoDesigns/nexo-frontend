'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Copy, Trash2 } from 'lucide-react'
import { SimpleContextMenu } from '@/components/ui/context-menu'
import { useDismiss } from '@/hooks/useDismiss'
import { cn } from '@/lib/utils'
import { InlineEditable } from './InlineEditable'
import { ReferencesPopover } from './ReferencesPopover'
import type { ResearchSolution } from '@/types'

export type EditableField = 'id' | 'title' | 'description' | 'key_references'

interface SolutionRowProps {
  solution: ResearchSolution
  checked: boolean
  onToggleChecked: () => void
  sendToLabel: string
  expanded: boolean
  onToggleExpanded: () => void
  onDuplicate: () => void
  /** Custom solutions only */
  onDelete?: () => void
  onSaveField?: (field: EditableField, value: string | string[]) => void
  /** A just-created custom solution opens with its title being edited */
  autoEditTitle?: boolean
}

/** One research solution (design 4a): tick to send it on, click to read it, right-click for actions. */
export function SolutionRow({
  solution,
  checked,
  onToggleChecked,
  sendToLabel,
  expanded,
  onToggleExpanded,
  onDuplicate,
  onDelete,
  onSaveField,
  autoEditTitle = false,
}: SolutionRowProps) {
  const t = useTranslations('pipeline')
  const editable = !!onSaveField
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [refsOpen, setRefsOpen] = useState(false)
  const refsRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLButtonElement>(null)
  const closeRefs = useCallback(() => setRefsOpen(false), [])
  useDismiss([refsRef, bookRef], closeRefs, refsOpen)

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
      className={cn(
        'relative flex flex-col rounded-lg border border-input bg-card',
        refsOpen ? 'z-20' : 'z-0'
      )}
    >
      <div
        onClick={onToggleExpanded}
        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3.5 py-3 hover:bg-[#252C35]"
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={(e) => {
            e.stopPropagation()
            onToggleChecked()
          }}
          title={sendToLabel}
          aria-label={sendToLabel}
          className={cn(
            'box-border flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-[1.5px] p-0 text-xs font-bold text-white',
            checked ? 'border-primary bg-primary' : 'border-border bg-transparent'
          )}
        >
          {checked ? '✓' : ''}
        </button>

        {editable ? (
          <InlineEditable
            value={solution.id}
            placeholder="—"
            onSave={(v) => onSaveField?.('id', v)}
            className="rounded bg-accent px-1.5 py-px text-[11.5px] font-semibold text-[#C7CEDA]"
            inputClassName="h-[22px] w-11 px-1.5 text-[11.5px] font-semibold"
          />
        ) : (
          <span className="rounded bg-accent px-1.5 py-px text-[11.5px] font-semibold text-[#C7CEDA]">
            {solution.id}
          </span>
        )}

        <div className="flex min-w-0 flex-1">
          {editable ? (
            <InlineEditable
              value={solution.title}
              placeholder={t('untitledSolution')}
              autoEdit={autoEditTitle}
              onSave={(v) => onSaveField?.('title', v)}
              className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground"
              inputClassName="h-[26px] min-w-0 flex-1 px-2 text-[13.5px] font-semibold"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">
              {solution.title}
            </span>
          )}
        </div>

        <span
          className={cn(
            'inline-block text-sm text-muted-foreground transition-transform duration-100',
            expanded && 'rotate-90'
          )}
        >
          ›
        </span>
        <button
          ref={bookRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setRefsOpen((v) => !v)
          }}
          title={t('referencesTitle', { id: solution.id })}
          aria-label={t('referencesTitle', { id: solution.id })}
          aria-expanded={refsOpen}
          className={cn(
            'flex h-[26px] w-7 items-center justify-center rounded transition-colors hover:bg-accent hover:text-foreground',
            refsOpen ? 'bg-accent text-foreground' : 'text-muted-foreground'
          )}
        >
          <BookOpen className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="flex px-3.5 pb-3.5">
          {editable ? (
            <InlineEditable
              value={solution.description}
              placeholder={t('addDescription')}
              multiline
              onSave={(v) => onSaveField?.('description', v)}
              className="max-w-[80ch] whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#C7CEDA]"
              inputClassName="w-full resize-y px-2.5 py-2 text-[12.5px] leading-relaxed"
            />
          ) : (
            <p className="m-0 max-w-[80ch] whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#C7CEDA]">
              {solution.description}
            </p>
          )}
        </div>
      )}

      {refsOpen && (
        <ReferencesPopover
          ref={refsRef}
          solutionId={solution.id}
          references={solution.key_references}
          onChange={editable ? (refs) => onSaveField?.('key_references', refs) : undefined}
          onClose={closeRefs}
        />
      )}

      <SimpleContextMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={[
          { label: t('duplicateOutput'), icon: Copy, onSelect: onDuplicate },
          ...(onDelete ? [{ label: t('delete'), icon: Trash2, onSelect: onDelete, destructive: true }] : []),
        ]}
        onClose={() => setMenu(null)}
      />
    </div>
  )
}
