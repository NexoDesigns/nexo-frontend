'use client'

import { Pencil, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/nlf-decision-tree'

interface QuestionCardProps {
  question: Question
  answer: string[] // selected option values
  onAnswer: (values: string[]) => void
  onUnknown: () => void
}

// Determines visual indentation: questions with 2+ dots in the id are sub-questions
function isSubQuestion(id: string) {
  return (id.match(/\./g) ?? []).length >= 2
}

export function QuestionCard({ question, answer, onAnswer, onUnknown }: QuestionCardProps) {
  const isAnswered = answer.length > 0
  const isUnknown = answer.includes('__unknown__')
  const sub = isSubQuestion(question.id)

  const handleSingle = (value: string) => {
    onAnswer([value])
  }

  const handleMulti = (value: string, checked: boolean) => {
    const next = checked
      ? [...answer.filter(v => v !== '__unknown__'), value]
      : answer.filter(v => v !== value)
    onAnswer(next)
  }

  const handleEdit = () => {
    onAnswer([])
  }

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card p-3 space-y-2.5',
        sub && 'ml-4 border-l-2 border-l-primary/30 rounded-l-none'
      )}
    >
      {/* Question header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{question.id}</span>
          <p className="text-xs font-medium text-foreground leading-snug">{question.label}</p>
        </div>
        {isAnswered && (
          <button
            onClick={handleEdit}
            className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="h-3 w-3" />
            Editar
          </button>
        )}
      </div>

      {/* Options (hidden after answer for single, editable for multi) */}
      {(!isAnswered || isUnknown || question.type === 'multi') && (
        <div className="space-y-1.5">
          {question.type === 'single' &&
            question.options.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors',
                  answer.includes(opt.value)
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/60 border border-transparent'
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={answer.includes(opt.value)}
                  onChange={() => handleSingle(opt.value)}
                  className="accent-primary h-3.5 w-3.5 shrink-0"
                />
                <span className="text-xs text-foreground">{opt.label}</span>
              </label>
            ))}

          {question.type === 'multi' &&
            question.options.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors',
                  answer.includes(opt.value)
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/60 border border-transparent'
                )}
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={answer.includes(opt.value)}
                  onChange={(e) => handleMulti(opt.value, e.target.checked)}
                  className="accent-primary h-3.5 w-3.5 shrink-0"
                />
                <span className="text-xs text-foreground">{opt.label}</span>
              </label>
            ))}
        </div>
      )}

      {/* Answered summary (single only) */}
      {isAnswered && !isUnknown && question.type === 'single' && (
        <div className="text-xs text-muted-foreground pl-1">
          {question.options.find((o) => o.value === answer[0])?.label ?? answer[0]}
        </div>
      )}

      {/* Bottom row: "No sé aún" button */}
      {!isAnswered && (
        <button
          onClick={onUnknown}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          No sé aún
        </button>
      )}

      {/* Unknown badge */}
      {isUnknown && (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-warning">
            <HelpCircle className="h-3.5 w-3.5" />
            Respuesta pendiente
          </span>
          <button
            onClick={handleEdit}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Contestar ahora
          </button>
        </div>
      )}
    </div>
  )
}
