'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Puzzle, Check, Info } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AVAILABLE_PLUGINS, type Plugin } from '@/types'

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>(AVAILABLE_PLUGINS)

  const toggle = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))
  }

  const enabledCount = plugins.filter(p => p.enabled).length

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
          <Puzzle size={28} className="text-[var(--primary)]" />
          Plugins
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Add SDK integrations to your Android builds. {enabledCount > 0 && (
            <span className="text-[var(--primary)]">{enabledCount} enabled</span>
          )}
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/15 mb-6">
        <Info size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-muted)]">
          Enabled plugins are automatically added as Gradle dependencies and their required permissions
          are injected into <code>AndroidManifest.xml</code> at build time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plugins.map((plugin, i) => (
          <motion.div
            key={plugin.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={`transition-all duration-200 ${plugin.enabled ? 'border-[var(--primary)]/40 shadow-brand-glow' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-[var(--text)]">{plugin.name}</p>
                    <Badge variant="muted">{plugin.version}</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-3">{plugin.description}</p>

                  {/* Gradle dep */}
                  <code className="text-[10px] bg-[var(--surface)] border border-[var(--border)] px-2 py-1 rounded-lg block text-[var(--text-subtle)] font-mono truncate">
                    {plugin.gradleDependency}
                  </code>

                  {/* Permissions */}
                  {plugin.permissions && plugin.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {plugin.permissions.map(p => (
                        <Badge key={p} variant="muted">{p}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(plugin.id)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer shrink-0 mt-0.5 ${
                    plugin.enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                  }`}
                  aria-label={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 flex items-center justify-center ${
                    plugin.enabled ? 'left-[22px]' : 'left-0.5'
                  }`}>
                    {plugin.enabled && <Check size={10} className="text-[var(--primary)]" />}
                  </span>
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enabled summary */}
      {enabledCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="border-[var(--primary)]/30">
            <p className="text-xs font-semibold text-[var(--text)] mb-3">Enabled Plugins ({enabledCount})</p>
            <div className="space-y-2">
              {plugins.filter(p => p.enabled).map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Check size={12} className="text-green-500" />
                  {p.name} — <code className="text-[var(--text-subtle)]">{p.gradleDependency.split(':')[1]}</code>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </AppLayout>
  )
}
