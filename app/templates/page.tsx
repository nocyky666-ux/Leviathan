'use client'

import { motion } from 'framer-motion'
import { FileText, ArrowRight, Globe, Cpu, Smartphone, Package } from 'lucide-react'
import Link from 'next/link'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const TEMPLATES = [
  {
    id: 'basic-twa',
    name: 'Basic TWA',
    description: 'Wrap any HTTPS website as a native Android app using Trusted Web Activity.',
    icon: Globe,
    color: '#5B5BD6',
    type: 'website',
    tags: ['TWA', 'Website', 'HTTPS'],
    config: {
      appName: 'My Web App',
      packageName: 'com.example.webapp',
      versionName: '1.0.0',
      versionCode: 1,
      minSdk: 21,
      targetSdk: 34,
      compileSdk: 34,
      orientation: 'sensor',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    },
  },
  {
    id: 'pwa-app',
    name: 'PWA Wrapper',
    description: 'Convert a Progressive Web App with manifest and service worker to APK.',
    icon: Smartphone,
    color: '#10B981',
    type: 'pwa',
    tags: ['PWA', 'Offline', 'Manifest'],
    config: {
      appName: 'My PWA',
      packageName: 'com.example.pwa',
      versionName: '1.0.0',
      versionCode: 1,
      minSdk: 24,
      targetSdk: 34,
      compileSdk: 34,
      orientation: 'sensor',
      displayMode: 'standalone',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE'],
    },
  },
  {
    id: 'flutter-basic',
    name: 'Flutter App',
    description: 'Build a Flutter project targeting Android with release AAB output.',
    icon: Cpu,
    color: '#54C5F8',
    type: 'flutter',
    tags: ['Flutter', 'Dart', 'Material'],
    config: {
      appName: 'Flutter App',
      packageName: 'com.example.flutter',
      versionName: '1.0.0',
      versionCode: 1,
      minSdk: 21,
      targetSdk: 34,
      compileSdk: 34,
      orientation: 'sensor',
      permissions: ['INTERNET'],
    },
  },
  {
    id: 'github-android',
    name: 'GitHub → APK',
    description: 'Pull a public GitHub repository and compile directly to APK via Actions.',
    icon: Package,
    color: '#F59E0B',
    type: 'github',
    tags: ['GitHub', 'CI/CD', 'Gradle'],
    config: {
      appName: 'GitHub Build',
      packageName: 'com.example.github',
      versionName: '1.0.0',
      versionCode: 1,
      minSdk: 21,
      targetSdk: 34,
      compileSdk: 34,
      orientation: 'sensor',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    },
  },
]

export default function TemplatesPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
          <FileText size={28} className="text-[var(--primary)]" />
          Templates
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Pre-configured build templates to get started instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {TEMPLATES.map((tpl, i) => {
          const Icon = tpl.icon
          return (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card hover className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tpl.color}18` }}>
                    <Icon size={20} style={{ color: tpl.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{tpl.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tpl.tags.map(tag => (
                        <Badge key={tag} variant="muted">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1 mb-5">
                  {tpl.description}
                </p>

                {/* Config preview */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 mb-4 text-xs space-y-1">
                  <div className="flex justify-between text-[var(--text-subtle)]">
                    <span>Package</span>
                    <span className="font-mono text-[var(--text-muted)]">{tpl.config.packageName}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-subtle)]">
                    <span>Min SDK</span>
                    <span className="text-[var(--text-muted)]">{tpl.config.minSdk}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-subtle)]">
                    <span>Permissions</span>
                    <span className="text-[var(--text-muted)]">{tpl.config.permissions.length}</span>
                  </div>
                </div>

                <Link
                  href={`/converter?type=${tpl.type}&template=${tpl.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)]/10
                    text-[var(--primary)] text-xs font-semibold hover:bg-[var(--primary)]/20 transition-colors"
                >
                  Use Template
                  <ArrowRight size={13} />
                </Link>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </AppLayout>
  )
}
