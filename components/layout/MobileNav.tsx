'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, FolderOpen, RefreshCw, Download, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { label: 'Home',      href: '/',          icon: LayoutDashboard },
  { label: 'Projects',  href: '/projects',  icon: FolderOpen },
  { label: 'Build',     href: '/converter', icon: RefreshCw },
  { label: 'Downloads', href: '/downloads', icon: Download },
  { label: 'Settings',  href: '/settings',  icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="glass rounded-2xl px-2 py-2 flex items-center justify-around">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative"
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-0 bg-[var(--primary)] rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                <Icon
                  size={20}
                  className={cn(
                    'transition-colors duration-150',
                    active ? 'text-white' : 'text-[var(--text-muted)]'
                  )}
                />
              </span>
              <span className={cn(
                'relative z-10 text-[10px] font-medium transition-colors duration-150',
                active ? 'text-white' : 'text-[var(--text-subtle)]'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
