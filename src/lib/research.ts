import type { ResearchOutputItem } from '@/types'

// ─── Research output parsing ──────────────────────────────────────────────────

function isResearchItem(item: unknown): item is ResearchOutputItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'solutions' in item &&
    Array.isArray((item as Record<string, unknown>).solutions)
  )
}

function extractFromArray(arr: unknown[]): ResearchOutputItem[] | null {
  // Direct: [{query_summary, solutions, error}]
  const direct = arr.filter(isResearchItem)
  if (direct.length > 0) return direct

  // n8n wrapper: [{json: {query_summary, solutions, error}}]
  const unwrapped = arr
    .filter((item) => typeof item === 'object' && item !== null && 'json' in item)
    .map((item) => (item as Record<string, unknown>).json)
    .filter(isResearchItem)
  if (unwrapped.length > 0) return unwrapped

  return null
}

/** The research items of a run's output_payload, whatever shape n8n returned. */
export function parseResearchOutput(payload: unknown): ResearchOutputItem[] {
  if (!payload) return []
  if (isResearchItem(payload)) return [payload]
  if (Array.isArray(payload)) return extractFromArray(payload) ?? []
  if (typeof payload === 'object') {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      if (isResearchItem(value)) return [value]
      if (Array.isArray(value)) {
        const result = extractFromArray(value)
        if (result) return result
      }
    }
  }
  return []
}

// ─── Solution ids ─────────────────────────────────────────────────────────────

/** Next unused single-letter id (A…Z), then Z1, Z2… */
export function nextFreeSolutionId(usedIds: Iterable<string>): string {
  const used = new Set(usedIds)
  for (let i = 0; i < 26; i++) {
    const c = String.fromCharCode(65 + i)
    if (!used.has(c)) return c
  }
  let n = 1
  while (used.has(`Z${n}`)) n++
  return `Z${n}`
}

// ─── References ───────────────────────────────────────────────────────────────

export interface ReferenceView {
  title: string
  /** Domain of a URL reference */
  source: string | null
  href: string | null
}

/** References are plain strings: a URL shows its path as title and its domain as source. */
export function describeReference(ref: string): ReferenceView {
  const text = ref.trim()
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text)
      const path = decodeURIComponent(url.pathname + url.search).replace(/\/$/, '')
      return {
        title: path && path !== '/' ? path.replace(/^\//, '') : url.hostname,
        source: url.hostname.replace(/^www\./, ''),
        href: text,
      }
    } catch {
      // fall through to plain text
    }
  }
  return { title: text, source: null, href: null }
}
