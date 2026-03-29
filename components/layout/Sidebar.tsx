'use client'

import { useTranslations } from 'next-intl'
import { usePathname, Link } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import { LocaleSwitcher } from './LocaleSwitcher'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Cpu,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { href: '/projects', icon: FolderKanban, labelKey: 'projects' },
  { href: '/knowledge-base', icon: BookOpen, labelKey: 'knowledgeBase' },
] as const

export function Sidebar() {
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
          <Cpu className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground leading-none">
            {tCommon('appName')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {tCommon('appNameSubtitle')}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 pt-3">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link key={href} href={href}>
              <span
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {t(labelKey)}
                {isActive && (
                  <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground" />
                )}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user + locale */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground truncate max-w-[110px]">
            {user?.email ?? '—'}
          </span>
          <LocaleSwitcher />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground text-xs h-8"
          onClick={signOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('logout')}
        </Button>
      </div>
    </aside>
  )
}
