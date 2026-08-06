import { Space_Grotesk, DM_Sans, IBM_Plex_Mono } from 'next/font/google'

// Typefaces for the public site (theme-landing) — landing, productos, login.
// The dashboard keeps its own fonts; these are exposed as CSS variables and
// only consumed inside the .theme-landing scope.

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

export const publicFontVars = `${spaceGrotesk.variable} ${dmSans.variable} ${ibmPlexMono.variable}`
