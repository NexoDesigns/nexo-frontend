'use client'

import { useTranslations } from 'next-intl'
import { usePathname, Link } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import { LocaleSwitcher } from './LocaleSwitcher'
import { UserAvatar, getUserDisplayName } from './UserAvatar'
import { cn } from '@/lib/utils'
import { ExternalLink, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_VERSION, DATASHEETS_URL } from '@/lib/constants'
import { NAV_PANEL } from '@/lib/design-constants'
import { SidePanel } from './SidePanel'

const navItems = [
  { href: '/', labelKey: 'dashboard' },
  { href: '/projects', labelKey: 'projects' },
  { href: '/knowledge-base', labelKey: 'knowledgeBase' },
] as const

const itemBase = 'flex items-center gap-2.5 rounded-[5px] py-2 pr-2.5 text-[13px] transition-colors'
const itemIdle = 'pl-[23px] text-muted-foreground hover:bg-card hover:text-foreground'

export function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    // Docked left with the same resize / hide / reveal mechanics as the run history
    <SidePanel
      side="left"
      storageKey="nav"
      defaultWidth={NAV_PANEL.defaultWidth}
      minWidth={NAV_PANEL.minWidth}
      className="border-sidebar-border"
      bodyClassName="flex flex-col"
    >
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3">
        {navItems.map(({ href, labelKey }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                itemBase,
                isActive ? 'bg-accent pl-2.5 font-semibold text-foreground' : itemIdle
              )}
            >
              {isActive && <span className="h-4 w-[3px] shrink-0 rounded-sm bg-primary" />}
              {t(labelKey)}
            </Link>
          )
        })}

        {/* Tools on their own subdomain, behind the same sign-in */}
        <a
          href={DATASHEETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(itemBase, itemIdle)}
        >
          {t('datasheets')}
          <ExternalLink className="ml-auto h-3 w-3" />
        </a>
      </nav>

      {/* Bottom: user, language, version, logout */}
      <div className="flex flex-col gap-2 border-t border-input px-4 py-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar user={user} />
          <span className="truncate text-[13px] text-[#C7CEDA]">{getUserDisplayName(user)}</span>
        </div>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <span className="text-[10px] text-muted-foreground/60">v{APP_VERSION}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={signOut}
            title={t('logout')}
            aria-label={t('logout')}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </SidePanel>
  )
}
