import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/routing'
import { BackgroundVideo } from '@/components/public/BackgroundVideo'
import { Reveal } from '@/components/public/Reveal'
import { SiteHeader } from '@/components/public/SiteHeader'
import { SiteFooter } from '@/components/public/SiteFooter'

const CONTACT_EMAIL = 'hola@nexodesign.ai'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'products.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description'), type: 'website' },
  }
}

type Package = {
  id: string
  name: string
  tagline: string
  price: string
  body: string
  features: string[]
  cta: string
  featured: boolean
}
type Addon = { title: string; body: string }

export default async function ProductosPage() {
  const t = await getTranslations('products')
  const packages = t.raw('packages') as Package[]
  const addons = t.raw('addons.items') as Addon[]

  return (
    <div id="top" className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <BackgroundVideo src="/media/platform.mp4" opacity={0.32} />
        <div className="relative mx-auto max-w-[1400px] px-6 pb-20 pt-40 lg:px-10 lg:pb-28 lg:pt-52">
          <Reveal>
            <p className="eyebrow">{t('hero.eyebrow')}</p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="display-xl mt-8 max-w-4xl text-5xl sm:text-6xl lg:text-[4.5rem]">
              {t('hero.titleA')}
              <br />
              <span className="text-primary">{t('hero.titleB')}</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-10 max-w-xl border-t border-border pt-8 text-base leading-relaxed text-muted-foreground lg:text-lg">
              {t('hero.description')}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-px bg-border lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 110}>
                <div
                  className={`flex h-full flex-col px-8 py-12 lg:px-10 lg:py-14 ${
                    pkg.featured ? 'bg-surface' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                      {pkg.id} — {pkg.price}
                    </span>
                    {pkg.featured && (
                      <span className="border border-primary px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                        {t('featuredBadge')}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-8 font-display text-3xl leading-tight tracking-tight">
                    {pkg.name}
                  </h2>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {pkg.tagline}
                  </p>
                  <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{pkg.body}</p>
                  <ul className="mt-8 space-y-3 border-t border-border pt-8">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span aria-hidden className="text-primary">
                          —
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className={`mt-10 inline-flex items-center justify-center gap-2 px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-opacity hover:opacity-85 ${
                      pkg.featured
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {pkg.cta}
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <Reveal>
            <p className="eyebrow">{t('addons.eyebrow')}</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display-xl mt-8 max-w-3xl text-4xl sm:text-5xl">{t('addons.title')}</h2>
          </Reveal>
          <div className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {addons.map((a, i) => (
              <Reveal key={a.title} delay={i * 80}>
                <div className="h-full bg-background px-7 py-10">
                  <h3 className="font-display text-lg leading-snug tracking-tight">{a.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-28 text-center lg:px-10 lg:py-36">
          <Reveal>
            <h2 className="display-xl mx-auto max-w-3xl text-4xl sm:text-5xl">
              {t('bottom.title')}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 bg-primary px-8 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
              >
                {t('bottom.ctaEngineering')}
                <span aria-hidden>→</span>
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-border px-8 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {t('bottom.ctaPlatform')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
