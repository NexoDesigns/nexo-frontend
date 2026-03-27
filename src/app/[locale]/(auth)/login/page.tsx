'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Cpu, AlertCircle } from 'lucide-react'
import { useLocale } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
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

const { data, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
})

console.log('Login result:', JSON.stringify(data?.session?.access_token?.slice(0, 20)), authError)

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('invalid')
          ? t('invalidCredentials')
          : t('genericError')
      )
      setLoading(false)
      return
    }

    window.location.href = `/${locale}/`
  }

  return (
    <div className="animate-fade-in">
      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-8 shadow-2xl shadow-black/40">
        {/* Logo */}
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {t('loginTitle')}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('loginSubtitle')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email || !password}
          >
            {loading ? t('loginLoading') : t('loginButton')}
          </Button>
        </form>
      </div>
    </div>
  )
}
