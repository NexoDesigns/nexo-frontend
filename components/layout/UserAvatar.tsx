import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

export function getUserDisplayName(user: User | null): string {
  return user?.user_metadata?.full_name ?? user?.email ?? '—'
}

function getInitials(user: User | null): string {
  const fullName: string | undefined = user?.user_metadata?.full_name
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/)
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  }
  return (user?.email?.[0] ?? '?').toUpperCase()
}

export function UserAvatar({ user, className }: { user: User | null; className?: string }) {
  return (
    <span
      title={getUserDisplayName(user)}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3A4350] text-[11px] font-semibold text-foreground',
        className
      )}
    >
      {getInitials(user)}
    </span>
  )
}
