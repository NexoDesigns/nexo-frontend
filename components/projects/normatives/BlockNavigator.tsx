'use client'

import { Check, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/nlf-decision-tree'

interface BlockData {
  id: string
  label: string
  icon: string
}

interface BlockNavigatorProps {
  visibleBlocks: BlockData[]
  activeBlock: string
  onBlockChange: (id: string) => void
  flags: Set<string>
  answers: Record<string, string[]>
  allQuestions: Question[]
  collapsed: boolean
  onToggle: () => void
}

function getBlockProgress(
  blockId: string,
  flags: Set<string>,
  answers: Record<string, string[]>,
  allQuestions: Question[]
) {
  const visible = allQuestions.filter(
    (q) => q.block === blockId && (q.visibleWhen === null || flags.has(q.visibleWhen))
  )
  const done = visible.filter((q) => answers[q.id] != null && answers[q.id].length > 0).length
  return { total: visible.length, done }
}

export function BlockNavigator({
  visibleBlocks,
  activeBlock,
  onBlockChange,
  flags,
  answers,
  allQuestions,
  collapsed,
  onToggle,
}: BlockNavigatorProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2 gap-1 h-full overflow-hidden">
        {/* Toggle button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 mb-1 shrink-0"
          onClick={onToggle}
          title="Expandir bloques"
        >
          <PanelLeftOpen className="h-3.5 w-3.5" />
        </Button>

        {/* Collapsed block badges */}
        <div className="flex-1 overflow-y-auto w-full space-y-1 px-1">
          {visibleBlocks.map((block) => {
            const { total, done } = getBlockProgress(block.id, flags, answers, allQuestions)
            const isComplete = total > 0 && done === total
            const isActive = block.id === activeBlock

            return (
              <button
                key={block.id}
                onClick={() => onBlockChange(block.id)}
                className={cn(
                  'w-full flex flex-col items-center gap-0.5 rounded px-1 py-1.5 transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
                title={`${block.label} (${done}/${total})`}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <span className="text-xs font-mono font-bold leading-none">{block.id}</span>
                )}
                <span className="text-[9px] font-mono leading-none text-muted-foreground">
                  {done}/{total}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Expanded state
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Bloques
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onToggle}
          title="Colapsar bloques"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleBlocks.map((block) => {
          const { total, done } = getBlockProgress(block.id, flags, answers, allQuestions)
          const isComplete = total > 0 && done === total
          const isActive = block.id === activeBlock
          const progress = total > 0 ? (done / total) * 100 : 0

          return (
            <button
              key={block.id}
              onClick={() => onBlockChange(block.id)}
              className={cn(
                'w-full text-left rounded-md px-2.5 py-2 transition-colors space-y-1.5',
                isActive
                  ? 'bg-primary/10 border border-primary/30'
                  : 'border border-transparent hover:bg-muted/60'
              )}
            >
              {/* Block identity row */}
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                ) : (
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono font-bold',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {block.id}
                  </div>
                )}
                <span
                  className={cn(
                    'text-xs flex-1 leading-snug',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {block.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {done}/{total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-0.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isComplete ? 'bg-success' : isActive ? 'bg-primary' : 'bg-muted-foreground/40'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
