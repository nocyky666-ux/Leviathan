'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, ArrowRight, Package, Clock, CheckCircle, XCircle,
  TrendingUp, Globe, GitBranch, Archive, Cpu,
} from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { getSessionId, formatRelativeTime, formatBytes } from '@/lib/utils'
import type { Build } from '@/types'

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color = 'var(--primary)', delay = 0,
}: {
  label: string; value: string | number; icon: React.ElementType; color?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card hover className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--text)] leading-tight">{value}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
        </div>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// QUICK START CARDS
// ─────────────────────────────────────────────────────────────
const QUICK_STARTS = [
  { label: 'Website → APK', desc: 'Wrap any URL as a native Android app', icon: Globe, href: '/converter?type=website', color: '#5B5BD6' },
  { label: 'GitHub → APK',  desc: 'Build from a public or private repo',   icon: GitBranch, href: '/converter?type=github', color: '#10B981' },
  { label: 'ZIP → APK',     desc: 'Upload your project as a ZIP file',     icon: Archive, href: '/converter?type=zip',    color: '#F59E0B' },
  { label: 'Flutter → APK', desc: 'Build a Flutter project for Android',   icon: Cpu, href: '/converter?type=flutter', color: '#7C8CFF' },
]

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [recentBuilds, setRecentBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = getSessionId()
    fetch(`/api/builds?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => { if (d.builds) setRecentBuilds(d.builds) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: recentBuilds.length,
    success: recentBuilds.filter(b => b.status === 'success').length,
    failed: recentBuilds.filter(b => b.status === 'failed').length,
    running: recentBuilds.filter(b => ['running', 'queued', 'pending'].includes(b.status)).length,
  }

  return (
    <AppLayout>
      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="relative mb-12 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-6">
            <Zap size={12} className="text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--primary)]">
              Build Android Apps From The Browser
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[var(--text)] leading-[1.08] tracking-tight mb-4">
            <span className="gradient-text">Leviathan</span>
            <br />
            <span className="text-[var(--text-muted)] font-normal text-3xl md:text-4xl">
              by Dev Noctky
            </span>
          </h1>

          <p className="text-base text-[var(--text-muted)] max-w-lg mb-8">
            Convert websites, PWAs, GitHub repos, ZIP archives, and source code into
            Android APKs — entirely from your browser. No login required.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/converter">
              <Button size="lg" iconRight={<ArrowRight size={18} />}>
                Start Building
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="secondary" icon={<Clock size={16} />}>
                Build History
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── STATS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Builds"    value={stats.total}   icon={Package}       color="var(--primary)" delay={0.1} />
        <StatCard label="Successful"      value={stats.success} icon={CheckCircle}   color="#10B981"        delay={0.15} />
        <StatCard label="Failed"          value={stats.failed}  icon={XCircle}       color="#EF4444"        delay={0.2} />
        <StatCard label="In Progress"     value={stats.running} icon={TrendingUp}    color="#F59E0B"        delay={0.25} />
      </div>

      {/* ── QUICK START ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--text)]">Quick Start</h2>
          <Link href="/converter" className="text-xs text-[var(--primary)] hover:underline">
            All options →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_STARTS.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
              >
                <Link href={item.href}>
                  <Card hover className="flex flex-col gap-3 group cursor-pointer h-full">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
                      style={{ background: `${item.color}18` }}
                    >
                      <Icon size={18} style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">{item.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-subtle)] group-hover:text-[var(--primary)] transition-colors mt-auto" />
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── RECENT BUILDS ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--text)]">Recent Builds</h2>
          <Link href="/history" className="text-xs text-[var(--primary)] hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-2xl" />
            ))}
          </div>
        ) : recentBuilds.length === 0 ? (
          <Card className="text-center py-12">
            <Package size={32} className="text-[var(--text-subtle)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-muted)]">No builds yet</p>
            <p className="text-xs text-[var(--text-subtle)] mt-1 mb-4">Start your first Android build in seconds</p>
            <Link href="/converter">
              <Button size="sm">Create Build</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentBuilds.slice(0, 5).map((build, i) => (
              <motion.div
                key={build.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
              >
                <Card hover className="flex items-center justify-between gap-4 py-3.5 px-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">
                        {build.appConfig?.appName ?? 'Unnamed Build'}
                      </p>
                      <p className="text-xs text-[var(--text-subtle)] truncate">
                        {build.projectType} · {formatRelativeTime(build.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {build.artifactSize && (
                      <span className="text-xs text-[var(--text-subtle)] hidden sm:block">
                        {formatBytes(build.artifactSize)}
                      </span>
                    )}
                    <StatusBadge status={build.status} />
                    {build.status === 'success' && (
                      <Link href={`/api/download/${build.id}`}>
                        <Button size="sm" variant="ghost">↓</Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  )
}
