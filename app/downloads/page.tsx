'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Package, Clock, RefreshCw, ExternalLink } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { getSessionId, formatRelativeTime, formatBytes } from '@/lib/utils'
import type { Build } from '@/types'

export default function DownloadsPage() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = getSessionId()
    fetch(`/api/builds?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => setBuilds((d.builds ?? []).filter((b: Build) => b.status === 'success')))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
          <Download size={28} className="text-[var(--primary)]" />
          Downloads
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Your completed APK/AAB builds. Files are available for 24 hours after build completion.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : builds.length === 0 ? (
        <Card className="text-center py-16">
          <Download size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-muted)]">No downloads yet</p>
          <p className="text-xs text-[var(--text-subtle)] mt-1 mb-4">
            Successful builds will appear here for download.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {builds.map((build, i) => (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">
                      {build.appConfig?.appName ?? 'Build'}.{build.outputFormat}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)] mt-0.5">
                      {build.appConfig?.packageName}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-5 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{formatRelativeTime(build.completedAt ?? build.createdAt)}</span>
                  </div>
                  {build.artifactSize && (
                    <span>{formatBytes(build.artifactSize)}</span>
                  )}
                  <span className="uppercase">{build.buildFlavor}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={build.status} />
                  <a href={`/api/download/${build.id}`} download>
                    <Button size="sm" icon={<Download size={13} />}>
                      Download
                    </Button>
                  </a>
                  {build.githubOwner && build.githubRepo && build.githubRunId && (
                    <a
                      href={`https://github.com/${build.githubOwner}/${build.githubRepo}/actions/runs/${build.githubRunId}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="ghost" icon={<ExternalLink size={13} />} />
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
