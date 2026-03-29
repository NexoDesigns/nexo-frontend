import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeDate } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { ArrowRight, Building2 } from 'lucide-react'
import type { Project } from '@/types'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
}

const STATUS_VARIANT: Record<
  Project['status'],
  'default' | 'success' | 'muted' | 'secondary'
> = {
  active: 'default',
  completed: 'success',
  archived: 'muted',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations('status')
  const locale = useLocale()

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group cursor-pointer transition-colors hover:border-border/60 hover:bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={STATUS_VARIANT[project.status]}>
                  {t(project.status)}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              {project.client_name && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {project.client_name}
                  </span>
                </div>
              )}
              {project.description && (
                <p className="mt-1.5 text-xs text-muted-foreground truncate-2 leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors mt-0.5" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {formatRelativeDate(project.updated_at, locale)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
