import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

import { routing } from '@/i18n/routing'
import {
  GATE_CALLBACK_PATH,
  TICKET_TTL_SECONDS,
  resolveGateTarget,
  signJwt,
} from '@/lib/gate'

/**
 * Ticket issuer for the gated subdomains (see src/lib/gate.ts).
 *
 * The app links to its tools through this route on its own origin (gatedUrl),
 * so the ticket comes from wherever the user is signed in. A tool's own
 * bounce, below, lands on its GATE_ISSUER_URL instead.
 *
 *   editor.nexodesign.ai  →  /api/auth/gate?next=<the URL they wanted>
 *                         →  (login, if there is no session)
 *                         →  editor.nexodesign.ai/__gate/callback?ticket=…
 *
 * Note this route is NOT covered by src/middleware.ts — its matcher excludes
 * `api/`. That is what we want: the middleware's generic bounce would lose the
 * destination, and this needs to send the user to login with a `redirect` that
 * comes back here and resumes.
 */

function localeFrom(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value
  return routing.locales.includes(cookie as (typeof routing.locales)[number])
    ? (cookie as string)
    : routing.defaultLocale
}

export async function GET(request: NextRequest) {
  const secret = process.env.GATE_TICKET_SECRET
  if (!secret) {
    console.error('[gate] GATE_TICKET_SECRET is not set — refusing to issue tickets')
    return new NextResponse('Auth gate is not configured', { status: 500 })
  }

  const url = new URL(request.url)

  // Vet the destination BEFORE anything else — including before the login
  // redirect, so an unvetted `next` never travels through the login flow.
  const target = resolveGateTarget(url.searchParams.get('next'))
  if (!target) {
    return new NextResponse('Unknown or missing destination', { status: 400 })
  }

  // getUser() refreshes an expired access token, which rotates the refresh
  // token. The new cookies MUST reach the browser: with the old refresh token
  // its next refresh is a reuse, and Supabase's reuse detection can then
  // revoke the whole session.
  const refreshed: { name: string; value: string; options?: Record<string, unknown> }[] = []
  const withSession = (response: NextResponse) => {
    refreshed.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    )
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: typeof refreshed) {
          refreshed.push(...cookiesToSet)
        },
      },
    }
  )

  // getUser() validates against Supabase rather than trusting the cookie's
  // contents, so the gate does not inherit the unverified-JWT shortcut the
  // backend still takes (nexo-backend/core/security.py).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL(`/${localeFrom(request)}/login`, url.origin)
    loginUrl.searchParams.set('redirect', `${url.pathname}${url.search}`)
    return withSession(NextResponse.redirect(loginUrl))
  }

  // Page-level access is authentication only, matching what the rest of Nexo
  // enforces today; the run's own data stays scoped by the editor-link token.
  // nexo-backend/core/authz.py is the counterpart, and the place both tighten.

  const issuedAt = Math.floor(Date.now() / 1000)
  const ticket = await signJwt(
    {
      sub: user.id,
      email: user.email,
      aud: target.origin,
      jti: crypto.randomUUID(),
      iat: issuedAt,
      exp: issuedAt + TICKET_TTL_SECONDS,
    },
    secret
  )

  const callback = new URL(GATE_CALLBACK_PATH, target.origin)
  callback.searchParams.set('ticket', ticket)
  callback.searchParams.set('next', target.pathWithQuery)

  // no-store: this response carries a credential in its Location header.
  return withSession(
    NextResponse.redirect(callback, {
      headers: { 'Cache-Control': 'no-store' },
    })
  )
}
