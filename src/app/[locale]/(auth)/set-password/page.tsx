'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { NexoLogo } from '@/components/public/NexoLogo'
import { Reveal } from '@/components/public/Reveal'

export default function SetPasswordPage() {
  const t = useTranslations('auth')
  const supabase = createClient()
  const locale = useLocale()

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = fullName.trim()
    if (!trimmedName) {
      setError(t('fullNameRequired'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setLoading(true)

    const { data: userData, error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError || !userData.user) {
      setError(t('genericError'))
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: trimmedName })
      .eq('id', userData.user.id)

    if (profileError) {
      setError(t('genericError'))
      setLoading(false)
      return
    }

    window.location.replace(`/${locale}`)
  }

  return (
    <>
      <Reveal>
        <NexoLogo className="h-8 w-auto" />
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 border border-border bg-background/80 px-8 py-10 backdrop-blur-xl">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="display-xl mt-5 text-3xl sm:text-4xl">{t('setPasswordTitle')}</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {t('setPasswordDescription')}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullName"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t('fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                autoFocus
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                autoComplete="new-password"
                minLength={6}
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-3 w-full border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {t('confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                placeholder={t('passwordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              disabled={loading || !fullName.trim() || !password || !confirmPassword}
              className="inline-flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? t('submitLoading') : t('setPasswordSubmit')}
              <span aria-hidden>→</span>
            </button>
          </form>
        </div>
      </Reveal>
    </>
  )
}
