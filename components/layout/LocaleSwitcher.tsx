'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'

const locales = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

export function LocaleSwitcher() {
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLocale = (code: string) => {
    router.replace(pathname, { locale: code })
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(prev => !prev)}
        title={tCommon('changeLanguage')}
      >
        <span className="text-base leading-none">{locales.find(l => l.code === locale)?.flag}</span>
      </Button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[130px] rounded-md border bg-popover shadow-md py-1">
          {locales.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
                locale === code ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span>{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
