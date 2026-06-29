'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ListOrdered, RefreshCw, Clock, Cpu } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, Progress } from '@/components/ui/Badge'
import { getSessionId, formatRelativeTime } from '@/lib/utils'
import type { Build } from '@/types'

export default function QueuePage() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActive = async () => {
    setLoading(true)
    const sessionId = getSessionId()
    try {
      const res = await fetch(`/api/builds?sessionId=${sessionId}`)
      const data = await res.json()
      const active = (data.builds ?? []).filter((b: Build) =>
        ['pending', 'queued', 'running'].includes(b.status)
      )
      setBuilds(active)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchActive()
    const interval = setInterval(fetchActive, 8000)
    return () => clearInterval(interval)
  }, [])

  const getProgress = (status: Build['status']): number => {
    if (status === 'pending') return 5
    if (status === 'queued') return 15
    if (status === 'running') return 55
    return 100
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
            <ListOrdered size={28} className="text-[var(--primary)]" />
            Build Queue
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Active builds are polled every 8 seconds. GitHub Actions usually starts in 1–2 minutes.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchActive} loading={loading}>
          Refresh
        </Button>
      </div>

      {loading && builds.length === 0 ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : builds.length === 0 ? (
        <Card className="text-center py-16">
          <ListOrdered size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-muted)]">Queue is empty</p>
          <p className="text-xs text-[var(--text-subtle)] mt-1">No active builds. Start one from the Universal Converter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {builds.map((build, i) => (
            <motion.div
              key={build.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                      <Cpu size={18} className="text-[var(--primary)] animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {build.appConfig?.appName ?? 'Unnamed Build'}
                      </p>
                      <p className="text-xs text-[var(--text-subtle)] mt-0.5 flex items-center gap-1.5">
                        <Clock size={10} />
                        Started {formatRelativeTime(build.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={build.status} />
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[var(--text-subtle)]">
                    <span className="capitalize">{
                      build.status === 'running' ? 'Compiling with Gradle...' :
                      build.status === 'queued' ? 'Waiting for runner...' :
                      'Initializing...'
                    }</span>
                    <span>{getProgress(build.status)}%</span>
                  </div>
                  <Progress value={getProgress(build.status)} animated={build.status === 'running'} />
                </div>

                {/* Build metadata */}
                <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                  <span>Type: <span className="text-[var(--text)]">{build.projectType}</span></span>
                  <span>Output: <span className="text-[var(--text)] uppercase">{build.outputFormat}</span></span>
                  <span>Flavor: <span className="text-[var(--text)] capitalize">{build.buildFlavor}</span></span>
                  {build.githubRunId && (
                    <a
                      href={`https://github.com/${build.githubOwner}/${build.githubRepo}/actions/runs/${build.githubRunId}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[var(--primary)] hover:underline"
                    >
                      View on GitHub →
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
