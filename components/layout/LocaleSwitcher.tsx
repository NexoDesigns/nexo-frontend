'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLocale = () => {
    const next = locale === 'es' ? 'en' : 'es'
    router.replace(pathname, { locale: next })
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleLocale}
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="sr-only">{locale.toUpperCase()}</span>
    </Button>
  )
}
