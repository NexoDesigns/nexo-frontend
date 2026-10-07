'use client'

import { forwardRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, X } from 'lucide-react'
import { describeReference } from '@/lib/research'
import { POPOVER } from '@/lib/design-constants'
import { InlineEditable } from './InlineEditable'

interface ReferencesPopoverProps {
  solutionId: string
  references: string[]
  /** Custom solutions: references can be edited, added and removed */
  onChange?: (references: string[]) => void
  onClose: () => void
}

/** A solution's references (design 4a). URLs show their path and domain and open in a new tab. */
export const ReferencesPopover = forwardRef<HTMLDivElement, ReferencesPopoverProps>(
  function ReferencesPopover({ solutionId, references, onChange, onClose }, ref) {
    const t = useTranslations('pipeline')
    // A reference being added is local until it gets some text
    const [adding, setAdding] = useState(false)
    const editable = !!onChange

    const saveAt = (i: number, value: string) => {
      if (!onChange) return
      // An emptied reference is removed
      onChange(value ? references.map((r, j) => (j === i ? value : r)) : references.filter((_, j) => j !== i))
    }

    return (
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-11 z-30 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_12px_32px_rgba(0,0,0,.45)]"
        style={{ width: POPOVER.referencesWidth, maxWidth: 'calc(100vw - 32px)' }}
      >
        <div className="flex items-center border-b border-input px-3.5 py-2.5">
          <span className="flex-1 text-[13px] font-semibold text-foreground">
            {t('referencesTitle', { id: solutionId })}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('dismiss')}
            className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {references.length === 0 && !editable && (
          <p className="px-3.5 py-3 text-xs text-muted-foreground">{t('noReferences')}</p>
        )}

        {references.map((reference, i) => {
          const view = describeReference(reference)
          const source = view.source ? `${view.source} ↗` : null

          if (editable) {
            return (
              <div
                key={`${i}-${reference}`}
                className="flex min-h-10 items-center gap-2.5 border-b border-[#2D343D] py-2 pl-3.5 pr-2 text-[13px] hover:bg-[#252C35]"
              >
                <InlineEditable
                  value={reference}
                  placeholder={t('untitledReference')}
                  onSave={(v) => saveAt(i, v)}
                  className="min-w-0 flex-1 truncate text-foreground"
                  inputClassName="h-[26px] min-w-0 flex-1 px-2 text-[13px]"
                />
                {source && view.href && (
                  <a
                    href={view.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 whitespace-nowrap text-xs text-muted-foreground hover:text-[#F0A56B]"
                  >
                    {source}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onChange?.(references.filter((_, j) => j !== i))}
                  title={t('removeReference')}
                  aria-label={t('removeReference')}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-[#FF9C85]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          }

          const content = (
            <>
              <span className="min-w-0 flex-1 truncate">{view.title}</span>
              {source && <span className="shrink-0 text-xs text-muted-foreground">{source}</span>}
            </>
          )
          return view.href ? (
            <a
              key={i}
              href={view.href}
              target="_blank"
              rel="noopener noreferrer"
              title={reference}
              className="flex items-center gap-3 border-b border-[#2D343D] px-3.5 py-[11px] text-[13px] text-foreground hover:bg-[#252C35] hover:no-underline"
            >
              {content}
            </a>
          ) : (
            <div
              key={i}
              title={reference}
              className="flex items-center gap-3 border-b border-[#2D343D] px-3.5 py-[11px] text-[13px] text-foreground"
            >
              {content}
            </div>
          )
        })}

        {editable && adding && (
          <div className="flex min-h-10 items-center gap-2.5 border-b border-[#2D343D] py-2 pl-3.5 pr-2 text-[13px]">
            <InlineEditable
              value=""
              placeholder={t('untitledReference')}
              autoEdit
              onSave={(v) => {
                if (v) onChange?.([...references, v])
              }}
              onDone={() => setAdding(false)}
              className="min-w-0 flex-1 truncate"
              inputClassName="h-[26px] min-w-0 flex-1 px-2 text-[13px]"
            />
          </div>
        )}

        {editable && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-9 items-center gap-2 px-3.5 text-left text-[12.5px] text-muted-foreground hover:bg-[#252C35] hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addReference')}
          </button>
        )}
      </div>
    )
  }
)
