import { cn } from '@/lib/utils'
import type { BuildStatus } from '@/types'

// ─── BADGE ────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted'
  className?: string
  dot?: boolean
}

const badgeVariants = {
  default: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20',
  success: 'bg-green-500/10 text-green-500 border-green-500/20',
  danger:  'bg-red-500/10 text-red-500 border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  info:    'bg-blue-500/10 text-blue-500 border-blue-500/20',
  muted:   'bg-[var(--card)] text-[var(--text-muted)] border-[var(--border)]',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
      badgeVariants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-green-500': variant === 'success',
        'bg-red-500':   variant === 'danger',
        'bg-yellow-500': variant === 'warning',
        'bg-[var(--primary)]': variant === 'default',
        'bg-[var(--text-subtle)]': variant === 'muted',
      })} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: BuildStatus }) {
  const map: Record<BuildStatus, { label: string; variant: BadgeProps['variant'] }> = {
    pending:   { label: 'Pending',    variant: 'muted' },
    queued:    { label: 'Queued',     variant: 'warning' },
    running:   { label: 'Building',   variant: 'default' },
    success:   { label: 'Complete',   variant: 'success' },
    failed:    { label: 'Failed',     variant: 'danger' },
    cancelled: { label: 'Cancelled',  variant: 'muted' },
    timeout:   { label: 'Timed out',  variant: 'warning' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

// ─── PROGRESS ─────────────────────────────────────────────────

interface ProgressProps {
  value: number   // 0–100
  className?: string
  color?: string
  animated?: boolean
}

export function Progress({ value, className, color = 'var(--primary)', animated = false }: ProgressProps) {
  return (
    <div className={cn('h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', animated && 'animate-pulse')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}
