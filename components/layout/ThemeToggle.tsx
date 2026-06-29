'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9 rounded-lg skeleton" />

  const isDark = resolvedTheme === 'dark'

  return (
    <motion.button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center gap-2.5 px-3 py-2 rounded-xl
        bg-[var(--card)] border border-[var(--border)]
        text-[var(--text-muted)] hover:text-[var(--text)]
        hover:border-[var(--primary)] transition-colors duration-200
        cursor-pointer select-none"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {/* Animated icon container */}
      <div className="relative w-4 h-4 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon size={15} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun size={15} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-medium whitespace-nowrap"
        >
          {isDark ? 'Dark' : 'Light'}
        </motion.span>
      )}
    </motion.button>
  )
}
