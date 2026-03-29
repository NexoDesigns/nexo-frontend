import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

// ─── Tailwind class merger ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatRelativeDate(
  dateString: string,
  locale: string = 'es'
): string {
  const date = new Date(dateString)
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: locale === 'es' ? es : enUS,
  })
}

export function formatAbsoluteDate(
  dateString: string,
  locale: string = 'es'
): string {
  const date = new Date(dateString)
  return format(date, 'dd MMM yyyy HH:mm', {
    locale: locale === 'es' ? es : enUS,
  })
}

// ─── File size ────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Duration ─────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

export function formatTokens(tokens: number | null): string {
  if (tokens === null) return '—'
  if (tokens < 1000) return `${tokens}`
  return `${(tokens / 1000).toFixed(1)}k`
}

// ─── Phase ordering ───────────────────────────────────────────────────────────

export const PHASE_ORDER = [
  'research',
  'ic_selection',
  'ic_naming_agent',
  'component_selection',
  'netlist',
] as const

export function getPhasesBeforeId(phaseId: string): string[] {
  const idx = PHASE_ORDER.indexOf(phaseId as (typeof PHASE_ORDER)[number])
  if (idx <= 0) return []
  return PHASE_ORDER.slice(0, idx)
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function isTerminalStatus(status: string): boolean {
  return status === 'completed' || status === 'failed'
}

// ─── Object helpers ───────────────────────────────────────────────────────────

export function omitNullish<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  ) as Partial<T>
}
