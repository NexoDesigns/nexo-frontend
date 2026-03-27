import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { RunStatus } from '@/types'
import { cn } from '@/lib/utils'

interface RunStatusBadgeProps {
  status: RunStatus
  className?: string
}

export function RunStatusBadge({ status, className }: RunStatusBadgeProps) {
  const t = useTranslations('runs')

  const config: Record<RunStatus, {
    variant: 'default' | 'success' | 'destructive' | 'warning' | 'muted'
    icon: React.ReactNode
    label: string
  }> = {
    pending: {
      variant: 'muted',
      icon: <Clock className="h-3 w-3" />,
      label: t('pending'),
    },
    running: {
      variant: 'warning',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: t('running'),
    },
    completed: {
      variant: 'success',
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: t('completed'),
    },
    failed: {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3" />,
      label: t('failed'),
    },
  }

  const { variant, icon, label } = config[status]

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      {icon}
      {label}
    </Badge>
  )
}
