'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter, routing } from '@/i18n/routing'

export function SiteLocaleSwitcher() {
  const t = useTranslations('landing.nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div
      role="group"
      aria-label={t('language')}
      className="flex items-center font-mono text-[11px] uppercase tracking-[0.18em]"
    >
      {routing.locales.map((code, i) => (
        <span key={code} className="flex items-center">
          {i > 0 && <span className="px-1.5 text-border">/</span>}
          <button
            type="button"
            aria-pressed={locale === code}
            onClick={() => router.replace(pathname, { locale: code })}
            className={
              locale === code
                ? 'text-foreground'
                : 'text-muted-foreground transition-colors hover:text-primary'
            }
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  )
}
