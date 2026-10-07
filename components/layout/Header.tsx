import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  /** Inline detail next to the title, e.g. an item count */
  meta?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function Header({ title, description, meta, actions, className }: HeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-6 pb-4 pt-6', className)}>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
          {meta != null && <span className="px-2 text-sm text-muted-foreground">{meta}</span>}
        </div>
        {description && (
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
