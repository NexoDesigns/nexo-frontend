import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

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
  const t = await getTranslations({ locale, namespace: 'landing.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description'), type: 'website' },
  }
}

type Stat = { value: string; label: string }
type Step = { step: string; title: string; body: string }
type Capability = { id: string; title: string; body: string }

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const stats = t.raw('stats') as Stat[]
  const steps = t.raw('platform.steps') as Step[]
  const capabilities = t.raw('capabilities.items') as Capability[]
  const sectors = t.raw('sectors.items') as string[]

  return (
    <div id="top" className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <BackgroundVideo src="/media/hero.mp4" opacity={0.6} />
        <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-20 pt-40 lg:px-10 lg:pb-28">
          <Reveal>
            <p className="eyebrow">{t('hero.eyebrow')}</p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="display-xl mt-8 max-w-5xl text-[13vw] leading-[0.92] sm:text-[9vw] lg:text-[6.4rem]">
              {t('hero.titleA')}
              <br />
              <span className="text-primary">{t('hero.titleB')}</span>
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-12 grid gap-10 border-t border-border pt-8 md:grid-cols-[1.2fr_1fr] md:items-end">
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
                {t('hero.description')}
              </p>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <a
                  href="#plataforma"
                  className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
                >
                  {t('hero.ctaPlatform')}
                </a>
                <a
                  href="#contacto"
                  className="inline-flex items-center gap-2 border border-border px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {t('hero.ctaContact')}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission */}
      <section id="mision" className="relative overflow-hidden border-t border-border">
        <BackgroundVideo src="/media/mission.mp4" opacity={0.28} />
        <div className="relative mx-auto max-w-[1400px] px-6 py-28 lg:px-10 lg:py-40">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <p className="eyebrow">{t('mission.eyebrow')}</p>
            </Reveal>
            <div>
              <Reveal delay={100}>
                <h2 className="display-xl text-4xl sm:text-5xl lg:text-[3.75rem]">
                  {t('mission.title')}
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <div className="mt-12 grid gap-10 sm:grid-cols-2">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {t('mission.p1')}
                  </p>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {t('mission.p2')}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={300}>
                <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
                  {stats.map((s) => (
                    <div key={s.label} className="bg-background/80 px-6 py-8 backdrop-blur-sm">
                      <dt className="font-display text-3xl text-primary lg:text-4xl">{s.value}</dt>
                      <dd className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {s.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Platform */}
      <section id="plataforma" className="relative overflow-hidden border-t border-border">
        <BackgroundVideo src="/media/platform.mp4" opacity={0.35} />
        <div className="relative mx-auto max-w-[1400px] px-6 py-28 lg:px-10 lg:py-40">
          <Reveal>
            <p className="eyebrow">{t('platform.eyebrow')}</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display-xl mt-8 max-w-3xl text-4xl sm:text-5xl lg:text-[3.75rem]">
              {t('platform.title')}
            </h2>
          </Reveal>
          <div className="mt-20 grid gap-px border border-border bg-border lg:grid-cols-3">
            {steps.map((item, i) => (
              <Reveal key={item.step} delay={i * 120}>
                <div className="h-full bg-background/85 px-8 py-12 backdrop-blur-sm lg:px-10 lg:py-14">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                    {item.step}
                  </span>
                  <h3 className="mt-8 font-display text-2xl leading-tight tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capacidades" className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10 lg:py-40">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <Reveal>
                <p className="eyebrow">{t('capabilities.eyebrow')}</p>
              </Reveal>
              <Reveal delay={100}>
                <h2 className="display-xl mt-8 text-4xl sm:text-5xl">{t('capabilities.title')}</h2>
              </Reveal>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {capabilities.map((cap, i) => (
                <Reveal key={cap.id} delay={(i % 2) * 90}>
                  <div className="group h-full bg-background px-7 py-10 transition-colors hover:bg-surface">
                    <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-primary">
                      {cap.id}
                    </span>
                    <h3 className="mt-6 font-display text-lg leading-snug tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{cap.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section id="sectores" className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <Reveal>
            <p className="eyebrow">{t('sectors.eyebrow')}</p>
          </Reveal>
          <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
            {sectors.map((s, i) => (
              <Reveal key={s} delay={i * 70}>
                <span className="font-display text-2xl tracking-tight text-muted-foreground transition-colors hover:text-primary sm:text-3xl lg:text-4xl">
                  {s}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contacto" className="relative overflow-hidden border-t border-border">
        <BackgroundVideo src="/media/hero.mp4" opacity={0.35} />
        <div className="relative mx-auto max-w-[1400px] px-6 py-32 text-center lg:px-10 lg:py-44">
          <Reveal>
            <h2 className="display-xl mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-[4rem]">
              {t('cta.title')}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t('cta.description')}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-12 inline-flex items-center gap-3 bg-primary px-8 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-85"
            >
              {CONTACT_EMAIL}
              <span aria-hidden>→</span>
            </a>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
