'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Upload, CheckCircle2, AlertCircle, Info, Package } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatBytes } from '@/lib/utils'
import type { AnalyzeResponse } from '@/types'

const TYPE_META: Record<string, { label: string; color: string }> = {
  flutter:        { label: 'Flutter',         color: '#54C5F8' },
  'react-native': { label: 'React Native',    color: '#61DAFB' },
  capacitor:      { label: 'Capacitor',       color: '#119EFF' },
  cordova:        { label: 'Apache Cordova',  color: '#E8E8E8' },
  'android-source': { label: 'Native Android', color: '#3DDC84' },
  pwa:            { label: 'PWA',             color: '#5B5BD6' },
  website:        { label: 'Web / HTML',      color: '#F97316' },
  zip:            { label: 'Unknown / ZIP',   color: '#6B7280' },
}

export default function AnalyzerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.zip')) { setFile(f); setResult(null); setError('') }
  }, [])

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Analysis failed'); return }
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const meta = result ? (TYPE_META[result.detected] ?? { label: result.detected, color: '#6B7280' }) : null

  return (
    <AppLayout>
      <div className="max-w-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
            <Search size={28} className="text-[var(--primary)]" />
            Project Analyzer
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Upload a ZIP file to auto-detect the project type and framework.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-150 mb-6 ${
            file ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
          }`}
        >
          {file ? (
            <div className="space-y-2">
              <Package size={28} className="text-[var(--primary)] mx-auto" />
              <p className="text-sm font-semibold text-[var(--text)]">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</p>
              <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-red-500 hover:underline cursor-pointer">
                Remove
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload size={28} className="text-[var(--text-subtle)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                Drop your <strong>.zip</strong> file here or <span className="text-[var(--primary)]">browse</span>
              </p>
              <p className="text-xs text-[var(--text-subtle)] mt-1">Supports: Flutter, React Native, Capacitor, Cordova, Android, PWA</p>
              <input type="file" accept=".zip" className="sr-only" onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null) }} />
            </label>
          )}
        </div>

        <Button onClick={analyze} loading={loading} disabled={!file} className="w-full mb-6" icon={<Search size={15} />}>
          Analyze Project
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <AnimatePresence>
          {result && meta && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Detected type */}
              <Card className="border-[var(--primary)]/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}18` }}>
                    <Package size={22} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-subtle)] mb-0.5">Detected Project Type</p>
                    <p className="text-xl font-bold text-[var(--text)]">{meta.label}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-[var(--text-subtle)]">Confidence</p>
                    <p className="text-2xl font-bold" style={{ color: meta.color }}>{result.confidence}%</p>
                  </div>
                </div>

                {/* Detected files */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: 'AndroidManifest.xml', ok: result.hasManifest },
                    { label: 'build.gradle', ok: result.hasGradle },
                    { label: 'pubspec.yaml', ok: result.hasPubspec },
                    { label: 'package.json', ok: result.hasPackageJson },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${
                      item.ok
                        ? 'border-green-500/20 bg-green-500/5 text-green-500'
                        : 'border-[var(--border)] text-[var(--text-subtle)]'
                    }`}>
                      {item.ok
                        ? <CheckCircle2 size={12} />
                        : <div className="w-3 h-3 rounded-full border border-current opacity-30" />
                      }
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Suggestion */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15">
                  <Info size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-muted)]">{result.suggestion}</p>
                </div>
              </Card>

              {/* Build CTA */}
              <Card>
                <p className="text-sm font-semibold text-[var(--text)] mb-1">Ready to build?</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Head to the Universal Converter and select <strong>{meta.label}</strong> as your project type.
                </p>
                <a href={`/converter?type=${result.detected}`}>
                  <Button size="sm" className="w-full">Go to Converter →</Button>
                </a>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
