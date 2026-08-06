'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { NexoLogo } from '@/components/public/NexoLogo'
import { Reveal } from '@/components/public/Reveal'

const CONTACT_EMAIL = 'hola@nexodesign.ai'

export default function LoginPage() {
  const t = useTranslations('auth')
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locale = useLocale()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('invalid')
          ? t('invalidCredentials')
          : t('genericError')
      )
      setLoading(false)
      return
    }

    // Espera a que la sesión esté escrita antes de navegar
    await new Promise(resolve => setTimeout(resolve, 500))
    window.location.replace(`/${locale}`)
  }

  return (
    <>
      <Reveal>
        <Link href="/home" className="inline-flex items-center" aria-label="Nexo Design">
          <NexoLogo className="h-8 w-auto" />
        </Link>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 border border-border bg-background/80 px-8 py-10 backdrop-blur-xl">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="display-xl mt-5 text-3xl sm:text-4xl">{t('signInTitle')}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t('signInDescription')}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t('emailCorporate')}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder={t('emailPlaceholderCorporate')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-3 w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-3 w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </div>

            {error && (
              <p className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs leading-relaxed text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="inline-flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? t('submitLoading') : t('submit')}
              <span aria-hidden>→</span>
            </button>
          </form>

          <p className="mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/productos" className="text-primary hover:underline">
              {t('seePackages')}
            </Link>{' '}
            {t('orWriteTo')}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <Link
          href="/home"
          className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
        >
          <span aria-hidden>←</span> {t('backToSite')}
        </Link>
      </Reveal>
    </>
  )
}
