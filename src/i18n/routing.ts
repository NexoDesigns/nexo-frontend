import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always',
  // English unless the visitor picks Spanish — don't infer it from the browser.
  localeDetection: false,
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
