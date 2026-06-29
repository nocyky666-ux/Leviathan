'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { motion } from 'framer-motion'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lev:sidebar')
    setSidebarCollapsed(saved === '1')

    // Watch for changes from Sidebar component
    const handler = () => {
      setSidebarCollapsed(localStorage.getItem('lev:sidebar') === '1')
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <motion.main
        animate={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 min-h-screen pb-24 md:pb-0 hidden-md-sidebar"
      >
        {/* On mobile, no margin offset since sidebar is hidden */}
        <div className="md:hidden">
          {/* Mobile: full width */}
          <div className="px-4 pt-6 pb-28">
            {children}
          </div>
        </div>
        <div className="hidden md:block px-6 pt-8 pb-8 max-w-7xl">
          {children}
        </div>
      </motion.main>

      <MobileNav />
    </div>
  )
}
