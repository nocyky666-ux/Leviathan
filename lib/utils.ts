import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BuildStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const secs = Math.floor(ms / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function statusColor(status: BuildStatus): string {
  switch (status) {
    case 'success':   return 'text-green-500'
    case 'failed':    return 'text-red-500'
    case 'running':   return 'text-[var(--primary)]'
    case 'queued':    return 'text-yellow-500'
    case 'cancelled': return 'text-[var(--text-muted)]'
    case 'timeout':   return 'text-orange-500'
    default:          return 'text-[var(--text-subtle)]'
  }
}

export function statusLabel(status: BuildStatus): string {
  switch (status) {
    case 'pending':   return 'Pending'
    case 'queued':    return 'Queued'
    case 'running':   return 'Building'
    case 'success':   return 'Complete'
    case 'failed':    return 'Failed'
    case 'cancelled': return 'Cancelled'
    case 'timeout':   return 'Timed out'
  }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('lev:session')
  if (!sid) {
    sid = crypto.randomUUID().replace(/-/g, '')
    localStorage.setItem('lev:session', sid)
  }
  return sid
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
