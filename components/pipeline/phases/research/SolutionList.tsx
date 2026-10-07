'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { nextFreeSolutionId } from '@/lib/research'
import type { CustomSolution, useResearchRun } from '@/hooks/useResearchRun'
import { SolutionRow, type EditableField } from './SolutionRow'
import type { ResearchSolution } from '@/types'

interface SolutionListProps {
  research: ReturnType<typeof useResearchRun>
  draftIds: string[]
  onToggle: (id: string) => void
  onAddToDraft: (id: string) => void
  onRemoveFromDraft: (id: string) => void
  /** A custom solution's id changed: keep selections pointing at it */
  onRenameId: (oldId: string, newId: string) => void
  nextPhaseName: string
}

/** The AI's solutions of a run, then the user's custom ones (design 4a). */
export function SolutionList({
  research,
  draftIds,
  onToggle,
  onAddToDraft,
  onRemoveFromDraft,
  onRenameId,
  nextPhaseName,
}: SolutionListProps) {
  const t = useTranslations('pipeline')
  const { originals, customs, allSolutions, customOutputs } = research
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [autoEditItemId, setAutoEditItemId] = useState<string | null>(null)
  const [idError, setIdError] = useState<string | null>(null)

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const usedIds = () => allSolutions.map((s) => s.id)

  const duplicate = (solution: ResearchSolution, sourceItemId: string) => {
    const id = nextFreeSolutionId(usedIds())
    customOutputs.addItem.mutate(
      {
        source_item_id: sourceItemId,
        source_item_label: id,
        data: { ...solution, id } as unknown as Record<string, unknown>,
      },
      { onSuccess: () => onAddToDraft(id) }
    )
  }

  const addBlank = () => {
    const id = nextFreeSolutionId(usedIds())
    customOutputs.addItem.mutate(
      {
        source_item_id: '',
        source_item_label: id,
        data: { id, title: '', description: '', key_references: [] },
      },
      {
        onSuccess: (created) => {
          setAutoEditItemId(created.id)
          setExpanded((prev) => new Set(prev).add(created.id))
          onAddToDraft(id)
        },
      }
    )
  }

  const saveField = (custom: CustomSolution, field: EditableField, value: string | string[]) => {
    if (field === 'id') {
      const newId = String(value)
      if (!newId || (newId !== custom.solution.id && usedIds().includes(newId))) {
        setIdError(newId ? t('idTaken', { id: newId }) : null)
        return
      }
      setIdError(null)
      onRenameId(custom.solution.id, newId)
    }
    customOutputs.updateItem.mutate({
      itemId: custom.item.id,
      data: { ...custom.item.data, ...custom.solution, [field]: value },
    })
  }

  const sendToLabel = t('sendTo', { phase: nextPhaseName })

  return (
    <div className="flex flex-col gap-2">
      {originals.map((solution) => (
        <SolutionRow
          key={`o-${solution.id}`}
          solution={solution}
          checked={draftIds.includes(solution.id)}
          onToggleChecked={() => onToggle(solution.id)}
          sendToLabel={sendToLabel}
          expanded={expanded.has(`o-${solution.id}`)}
          onToggleExpanded={() => toggleExpanded(`o-${solution.id}`)}
          onDuplicate={() => duplicate(solution, solution.id)}
        />
      ))}

      {/* Custom solutions: header + a "+" revealed on hover */}
      <div className="group flex min-h-8 items-center gap-1.5 pl-0.5 pt-1.5">
        {customs.length > 0 && (
          <span className="text-[11px] uppercase tracking-[.08em] text-muted-foreground">
            {t('customSolutions')}
          </span>
        )}
        <span className="flex-1" />
        <button
          type="button"
          onClick={addBlank}
          disabled={customOutputs.addItem.isPending}
          title={t('addCustomSolution')}
          aria-label={t('addCustomSolution')}
          className="flex h-7 w-7 items-center justify-center rounded-[5px] text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Plus className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      {idError && <p className="text-xs text-destructive">{idError}</p>}

      {customs.map((custom) => (
        <SolutionRow
          key={`c-${custom.item.id}`}
          solution={custom.solution}
          checked={draftIds.includes(custom.solution.id)}
          onToggleChecked={() => onToggle(custom.solution.id)}
          sendToLabel={sendToLabel}
          expanded={expanded.has(custom.item.id)}
          onToggleExpanded={() => toggleExpanded(custom.item.id)}
          onDuplicate={() =>
            duplicate(custom.solution, custom.item.source_item_id || custom.solution.id)
          }
          onDelete={() => {
            onRemoveFromDraft(custom.solution.id)
            customOutputs.deleteItem.mutate(custom.item.id)
          }}
          onSaveField={(field, value) => saveField(custom, field, value)}
          autoEditTitle={autoEditItemId === custom.item.id}
        />
      ))}
    </div>
  )
}
