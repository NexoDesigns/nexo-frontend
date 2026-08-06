import { getTranslations } from 'next-intl/server'

import { NexoLogo } from './NexoLogo'

export async function SiteFooter() {
  const t = await getTranslations('landing.footer')
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <NexoLogo className="h-8 w-auto self-start opacity-70" />
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          © {new Date().getFullYear()} Nexo Design · {t('tagline')}
        </p>
      </div>
    </footer>
  )
}
