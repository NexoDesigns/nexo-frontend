'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuestionCard } from './QuestionCard'
import type { Question } from '@/lib/nlf-decision-tree'

interface BlockData {
  id: string
  label: string
  icon: string
}

interface QuestionPanelProps {
  activeBlock: BlockData
  blockQuestions: Question[]           // visible questions for this block
  answers: Record<string, string[]>
  onAnswer: (questionId: string, values: string[]) => void
  onUnknown: (questionId: string) => void
  visibleBlocks: BlockData[]
  onBlockChange: (id: string) => void
}

export function QuestionPanel({
  activeBlock,
  blockQuestions,
  answers,
  onAnswer,
  onUnknown,
  visibleBlocks,
  onBlockChange,
}: QuestionPanelProps) {
  const currentIndex = visibleBlocks.findIndex((b) => b.id === activeBlock.id)
  const prevBlock = currentIndex > 0 ? visibleBlocks[currentIndex - 1] : null
  const nextBlock = currentIndex < visibleBlocks.length - 1 ? visibleBlocks[currentIndex + 1] : null

  const answered = blockQuestions.filter(
    (q) => answers[q.id] != null && answers[q.id].length > 0
  ).length
  const total = blockQuestions.length
  const progress = total > 0 ? (answered / total) * 100 : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Block header */}
      <div className="shrink-0 px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                Bloque {activeBlock.id}
              </p>
              <p className="text-sm font-medium text-foreground">{activeBlock.label}</p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {answered}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {blockQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <p className="text-xs">No hay preguntas para este bloque.</p>
          </div>
        ) : (
          blockQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              answer={answers[q.id] ?? []}
              onAnswer={(values) => onAnswer(q.id, values)}
              onUnknown={() => onUnknown(q.id)}
            />
          ))
        )}
      </div>

      {/* Footer: prev / next navigation */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => prevBlock && onBlockChange(prevBlock.id)}
          disabled={!prevBlock}
          className="gap-1.5 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {prevBlock ? `Bloque ${prevBlock.id}` : 'Inicio'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => nextBlock && onBlockChange(nextBlock.id)}
          disabled={!nextBlock}
          className="gap-1.5 text-xs"
        >
          {nextBlock ? `Bloque ${nextBlock.id}` : 'Fin'}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
