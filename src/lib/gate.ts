/**
 * Subdomain auth gate — the issuing half.
 *
 * Nexo's tools live on their own subdomains (editor.nexodesign.ai, and more to
 * come). They are static sites with no session of their own, so each one runs a
 * small middleware that refuses to serve anything until it holds a signed
 * session cookie, and sends visitors here to get one.
 *
 * This module mints the short-lived TICKET that buys that cookie, and holds the
 * two validation rules that keep the flow from becoming an open redirect.
 *
 * Why a ticket instead of sharing Supabase's cookie across *.nexodesign.ai:
 * a shared cookie would let every subdomain read the user's full Supabase
 * session, so an XSS in the smallest tool would hand over the whole account.
 * The subdomains never see that token; they get their own short, isolated
 * session instead.
 *
 * HMAC via Web Crypto rather than a JWT library, because the verifying half of
 * this (docs/gate-middleware/middleware.ts) is copied into repos that have no
 * package.json and no build step. Keeping it dependency-free keeps them that
 * way.
 */

/** Cookie the subdomain sets once a ticket checks out. Host-only, never shared. */
export const GATE_COOKIE_NAME = 'nexo_gate'

/** A ticket is spent within a redirect or two; it does not need to outlive that. */
export const TICKET_TTL_SECONDS = 60

/** How long a subdomain session lasts before the middleware silently re-gates. */
// 1 hour
export const GATE_SESSION_TTL_SECONDS = 60 * 60

/** Path every gated subdomain reserves for spending a ticket. */
export const GATE_CALLBACK_PATH = '/__gate/callback'

// ─── HS256 over Web Crypto ────────────────────────────────────────────────────

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Returns an ArrayBuffer rather than a Uint8Array: both consumers below want
 *  a BufferSource, and the view's generic buffer type does not satisfy it. */
function b64urlDecode(value: string): ArrayBuffer {
  const padding = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return buffer
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const signed = `${head}.${body}`
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    new TextEncoder().encode(signed)
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

/**
 * Verify signature and expiry. Returns the payload, or null for anything that
 * does not check out — a wrong signature and a malformed token are the same
 * answer on purpose, so this never reports *why* it said no.
 */
export async function verifyJwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    // crypto.subtle.verify compares in constant time.
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      b64urlDecode(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    )
    if (!ok) return null

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])))
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ─── Redirect validation ──────────────────────────────────────────────────────

/** Origins the gate will issue tickets for. Anything else is refused. */
export function allowedGateOrigins(): string[] {
  return (process.env.GATE_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export type GateTarget = { origin: string; pathWithQuery: string }

/**
 * Parse and vet the `next` a subdomain sent us.
 *
 * Refuses anything not on the allowlist — without this the gate is an open
 * redirect that also hands out signed tickets. Also refuses a `next` pointing
 * back at the callback, which would otherwise let a caller build a redirect
 * loop between the two halves.
 */
export function resolveGateTarget(next: string | null): GateTarget | null {
  if (!next) return null

  // if the URL is not a valid one syntax-wise, returns null
  let url: URL
  try {
    url = new URL(next)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null
  if (!allowedGateOrigins().includes(url.origin)) return null
  if (url.pathname === GATE_CALLBACK_PATH) return null

  return { origin: url.origin, pathWithQuery: `${url.pathname}${url.search}` }
}

/**
 * Vet a post-login destination. Relative paths only: the login page's job is to
 * put the user back on OUR origin, and the only external hop in this flow is
 * the one `resolveGateTarget` has already approved. Keeping this to relative
 * paths means the login page can never be pointed at another site.
 */
export function safeInternalRedirect(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null // protocol-relative → another origin
  if (value.includes('\\')) return null // some parsers read \ as /
  return value
}
