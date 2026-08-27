'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

import { NexoLogo } from './NexoLogo'

const anchors = [
  { key: 'mission', hash: 'mision' },
  { key: 'platform', hash: 'plataforma' },
  { key: 'capabilities', hash: 'capacidades' },
  { key: 'sectors', hash: 'sectores' },
] as const

export function SiteHeader() {
  const t = useTranslations('landing.nav')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-border bg-background/70 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <Link href="/home" className="flex shrink-0 items-center" aria-label="Nexo Design">
          <NexoLogo className="h-7 w-auto lg:h-8" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {anchors.map((link) => (
            <Link
              key={link.hash}
              href={`/home#${link.hash}`}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </Link>
          ))}
          <Link
            href="/productos"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('products')}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {t('signIn')}
          </Link>
          <Link
            href="/home#contacto"
            className="group relative hidden items-center gap-2 bg-primary px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85 sm:inline-flex"
          >
            {t('contact')}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
