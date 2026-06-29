'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { History, Package, Download, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { getSessionId, formatRelativeTime, formatBytes, formatDuration } from '@/lib/utils'
import type { Build } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  website: 'Website',
  pwa: 'PWA',
  twa: 'TWA',
  zip: 'ZIP',
  github: 'GitHub',
  flutter: 'Flutter',
  'react-native': 'React Native',
  capacitor: 'Capacitor',
  cordova: 'Cordova',
  'android-source': 'Android Source',
}

export default function HistoryPage() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'running'>('all')

  const fetchBuilds = async () => {
    setLoading(true)
    const sessionId = getSessionId()
    try {
      const res = await fetch(`/api/builds?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.builds) setBuilds(data.builds)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBuilds() }, [])

  const filtered = builds.filter(b => {
    if (filter === 'all') return true
    if (filter === 'running') return ['pending', 'queued', 'running'].includes(b.status)
    return b.status === filter
  })

  const buildDuration = (build: Build): string => {
    if (!build.completedAt) return '—'
    const ms = new Date(build.completedAt).getTime() - new Date(build.createdAt).getTime()
    return formatDuration(ms)
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
            <History size={28} className="text-[var(--primary)]" />
            Build History
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            All builds for your current session. Builds are stored for 24 hours.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchBuilds} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(['all', 'success', 'failed', 'running'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer capitalize ${
              filter === f
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {f === 'all' ? `All (${builds.length})` : f}
          </button>
        ))}
      </div>

      {/* Build list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <Package size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-muted)]">No builds found</p>
          <p className="text-xs text-[var(--text-subtle)] mt-1">
            {filter === 'all' ? 'Start your first build to see it here.' : `No ${filter} builds.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((build, i) => (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* App info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                    <Package size={18} className="text-[var(--primary)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">
                      {build.appConfig?.appName ?? 'Unnamed Build'}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                      {build.appConfig?.packageName ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] sm:gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">Type</p>
                    <p>{TYPE_LABELS[build.projectType] ?? build.projectType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">Output</p>
                    <p className="uppercase">{build.outputFormat} · {build.buildFlavor}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">Duration</p>
                    <p>{buildDuration(build)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">Size</p>
                    <p>{build.artifactSize ? formatBytes(build.artifactSize) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">Started</p>
                    <p>{formatRelativeTime(build.createdAt)}</p>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={build.status} />
                  {build.status === 'success' && (
                    <a href={`/api/download/${build.id}`} download>
                      <Button size="sm" variant="secondary" icon={<Download size={12} />}>
                        APK
                      </Button>
                    </a>
                  )}
                  {build.githubRepo && build.githubOwner && build.githubRunId && (
                    <a
                      href={`https://github.com/${build.githubOwner}/${build.githubRepo}/actions/runs/${build.githubRunId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="ghost" icon={<ExternalLink size={12} />} />
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
