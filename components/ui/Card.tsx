import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, glass = false, hover = false, padding = 'md' }: CardProps) {
  const base = cn(
    'rounded-2xl border border-[var(--border)] transition-all duration-200',
    glass
      ? 'glass'
      : 'bg-[var(--card)]',
    hover && 'hover:border-[var(--primary)]/40 hover:shadow-brand-glow cursor-pointer',
    paddings[padding],
    className
  )

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        className={base}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base}>{children}</div>
}
