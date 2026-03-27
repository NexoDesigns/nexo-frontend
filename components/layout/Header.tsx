import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function Header({ title, description, actions, className }: HeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border px-6 py-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
