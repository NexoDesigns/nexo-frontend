import { Inter, Space_Grotesk, DM_Sans, IBM_Plex_Mono } from 'next/font/google'

// Platform (logged-in app) typeface — redesign v2.
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

// Typefaces for the public site (theme-landing) — landing, productos, login.
// Exposed as CSS variables and consumed inside the .theme-landing scope
// (IBM Plex Mono is also the platform's monospace).

export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const publicFontVars = `${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${ibmPlexMono.variable}`
