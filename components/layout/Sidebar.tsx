'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, RefreshCw, GitBranch, Sliders,
  ListOrdered, History, Search, GitCompare, Puzzle,
  FileText, Download, Settings, ChevronLeft, ChevronRight,
  Zap,
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',          href: '/',             icon: LayoutDashboard },
  { id: 'projects',    label: 'Projects',            href: '/projects',     icon: FolderOpen },
  { id: 'converter',   label: 'Universal Converter', href: '/converter',    icon: RefreshCw },
  { id: 'repo',        label: 'Repository Builder',  href: '/repo',         icon: GitBranch },
  { id: 'editor',      label: 'Visual Editor',       href: '/editor',       icon: Sliders },
  { id: 'queue',       label: 'Build Queue',         href: '/queue',        icon: ListOrdered },
  { id: 'history',     label: 'Build History',       href: '/history',      icon: History },
  { id: 'analyzer',    label: 'APK Analyzer',        href: '/analyzer',     icon: Search },
  { id: 'diff',        label: 'APK Diff Viewer',     href: '/diff',         icon: GitCompare },
  { id: 'plugins',     label: 'Plugins',             href: '/plugins',      icon: Puzzle },
  { id: 'templates',   label: 'Templates',           href: '/templates',    icon: FileText },
  { id: 'downloads',   label: 'Downloads',           href: '/downloads',    icon: Download },
  { id: 'settings',    label: 'Settings',            href: '/settings',     icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('lev:sidebar')
    if (saved) setCollapsed(saved === '1')
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('lev:sidebar', next ? '1' : '0')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="hidden md:flex flex-col h-screen fixed top-0 left-0 z-40
        bg-[var(--surface)] border-r border-[var(--border)]
        overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]',
        collapsed && 'justify-center px-0'
      )}>
        <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0 shadow-brand-glow">
          <Zap size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-sm font-semibold text-[var(--text)] leading-tight">Leviathan</p>
              <p className="text-[10px] text-[var(--text-subtle)] leading-tight">by Dev Noctky</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto no-scrollbar">
        <ul className="space-y-0.5">
          {NAV.map(item => {
            const Icon = item.icon
            const active = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    collapsed && 'justify-center px-0 py-2.5',
                    active
                      ? 'bg-[var(--primary)] text-white shadow-brand-glow'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--card)]'
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className={cn(
        'p-3 border-t border-[var(--border)] flex flex-col gap-2',
        collapsed ? 'items-center' : ''
      )}>
        <ThemeToggle collapsed={collapsed} />

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-subtle)]',
            'hover:text-[var(--text)] hover:bg-[var(--card)] transition-colors duration-150 cursor-pointer',
            collapsed && 'justify-center px-0 w-9 h-9'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
