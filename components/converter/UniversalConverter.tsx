'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Archive, GitBranch, Smartphone, Upload,
  ChevronRight, ChevronDown, Settings2, Cpu, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { BuildLogs } from '@/components/build/BuildLogs'
import { defaultAppConfig } from '@/lib/generators'
import { getSessionId, formatBytes } from '@/lib/utils'
import type { ProjectType, OutputFormat, BuildFlavor, AppConfig, Build } from '@/types'
import { ANDROID_PERMISSIONS } from '@/types'

// ─────────────────────────────────────────────────────────────
// SOURCE TYPE SELECTOR
// ─────────────────────────────────────────────────────────────
const SOURCE_TYPES: { id: ProjectType; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'website', label: 'Website URL',    desc: 'Wrap any website as a native TWA',    icon: Globe },
  { id: 'pwa',     label: 'PWA',            desc: 'Progressive Web App with manifest',   icon: Smartphone },
  { id: 'zip',     label: 'ZIP File',       desc: 'Upload project as a ZIP archive',     icon: Archive },
  { id: 'github',  label: 'GitHub Repo',    desc: 'Build directly from a repository',   icon: GitBranch },
  { id: 'flutter', label: 'Flutter',        desc: 'Flutter project (pubspec.yaml)',      icon: Cpu },
]

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function UniversalConverter() {
  const [step, setStep] = useState<'source' | 'config' | 'building' | 'done'>('source')
  const [sourceType, setSourceType] = useState<ProjectType>('website')
  const [url, setUrl] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('apk')
  const [buildFlavor, setBuildFlavor] = useState<BuildFlavor>('debug')
  const [appConfig, setAppConfig] = useState<AppConfig>(defaultAppConfig())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [build, setBuild] = useState<Build | null>(null)

  // ── File drop ──────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.zip')) setFile(f)
  }, [])

  // ── Submit build ───────────────────────────────────────────
  const handleBuild = async () => {
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('projectType', sourceType)
      fd.append('outputFormat', outputFormat)
      fd.append('buildFlavor', buildFlavor)
      fd.append('appConfig', JSON.stringify(appConfig))
      fd.append('sessionId', getSessionId())
      if (url) fd.append('url', url)
      if (githubRepo) fd.append('githubRepo', githubRepo)
      if (file) fd.append('file', file)

      const res = await fetch('/api/build', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Build failed to start')
        return
      }

      setStep('building')

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const statusRes = await fetch(`/api/status/${data.buildId}`)
        const statusData = await statusRes.json()
        setBuild(statusData.build)

        if (['success', 'failed', 'cancelled', 'timeout'].includes(statusData.build?.status)) {
          clearInterval(pollInterval)
          setStep('done')
        }
      }, 4000)

      // Initial build object
      setBuild({ id: data.buildId, status: 'queued', ...data } as Build)

    } catch (err) {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (key: keyof AppConfig, value: unknown) => {
    setAppConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs text-[var(--text-subtle)]">
        {['source', 'config', 'building', 'done'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
              step === s
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : ['building', 'done', 'config'].indexOf(step) > ['building', 'done', 'config', 'source'].indexOf(s as string)
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-[var(--card)] text-[var(--text-subtle)] border-[var(--border)]'
            }`}>
              {i + 1}
            </div>
            {i < 3 && <div className="w-8 h-px bg-[var(--border)]" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: SOURCE ─────────────────────────────── */}
        {step === 'source' && (
          <motion.div
            key="source"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-1">What are you converting?</h2>
              <p className="text-sm text-[var(--text-muted)]">Choose your project source to get started.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {SOURCE_TYPES.map(type => {
                const Icon = type.icon
                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSourceType(type.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                      sourceType === type.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-brand-glow'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      sourceType === type.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--text)]">{type.label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{type.desc}</p>
                    </div>
                    {sourceType === type.id && (
                      <CheckCircle2 size={18} className="text-[var(--primary)] shrink-0" />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Dynamic input based on source type */}
            <div className="space-y-3">
              {(sourceType === 'website' || sourceType === 'pwa') && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Website URL *</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://your-website.com"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--primary)]
                      transition-colors duration-150"
                  />
                </div>
              )}

              {sourceType === 'github' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">GitHub Repository *</label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={e => setGithubRepo(e.target.value)}
                    placeholder="owner/repository-name"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--primary)]
                      transition-colors duration-150"
                  />
                </div>
              )}

              {(sourceType === 'zip' || sourceType === 'flutter') && (
                <div
                  onDrop={onDrop}
                  onDragOver={e => e.preventDefault()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-150 ${
                    file ? 'border-green-500 bg-green-500/5' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                  }`}
                >
                  {file ? (
                    <div className="space-y-1">
                      <CheckCircle2 size={24} className="text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-[var(--text)]">{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</p>
                      <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline cursor-pointer">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload size={24} className="text-[var(--text-subtle)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">Drop your <strong>.zip</strong> file here or <span className="text-[var(--primary)]">browse</span></p>
                      <p className="text-xs text-[var(--text-subtle)] mt-1">Max 50MB</p>
                      <input type="file" accept=".zip" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => setStep('config')}
              disabled={
                (sourceType === 'website' || sourceType === 'pwa') && !url ||
                sourceType === 'github' && !githubRepo ||
                (sourceType === 'zip' || sourceType === 'flutter') && !file
              }
              className="w-full"
              iconRight={<ChevronRight size={16} />}
            >
              Configure App
            </Button>
          </motion.div>
        )}

        {/* ── STEP 2: CONFIG ─────────────────────────────── */}
        {step === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-1">Configure your app</h2>
              <p className="text-sm text-[var(--text-muted)]">Set up the Android app metadata.</p>
            </div>

            <Card className="space-y-4">
              {[
                { key: 'appName', label: 'App Name', placeholder: 'My Awesome App', type: 'text' },
                { key: 'packageName', label: 'Package Name', placeholder: 'com.example.myapp', type: 'text' },
                { key: 'versionName', label: 'Version Name', placeholder: '1.0.0', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={String(appConfig[field.key as keyof AppConfig] ?? '')}
                    onChange={e => updateConfig(field.key as keyof AppConfig, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>
              ))}

              {/* Output format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Output</label>
                  <select
                    value={outputFormat}
                    onChange={e => setOutputFormat(e.target.value as OutputFormat)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                  >
                    <option value="apk">APK</option>
                    <option value="aab">AAB (Play Store)</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Build Type</label>
                  <select
                    value={buildFlavor}
                    onChange={e => setBuildFlavor(e.target.value as BuildFlavor)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                  >
                    <option value="debug">Debug</option>
                    <option value="release">Release</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Advanced settings */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <Settings2 size={14} />
              Advanced Settings
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Card className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'minSdk', label: 'Min SDK' },
                        { key: 'targetSdk', label: 'Target SDK' },
                        { key: 'versionCode', label: 'Version Code' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{f.label}</label>
                          <input
                            type="number"
                            value={Number(appConfig[f.key as keyof AppConfig])}
                            onChange={e => updateConfig(f.key as keyof AppConfig, parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                              text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Orientation */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Orientation</label>
                      <select
                        value={appConfig.orientation}
                        onChange={e => updateConfig('orientation', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                          text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                      >
                        <option value="sensor">Auto</option>
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Permissions</label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                        {ANDROID_PERMISSIONS.map(perm => (
                          <label key={perm} className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)] transition-colors">
                            <input
                              type="checkbox"
                              checked={appConfig.permissions.includes(perm)}
                              onChange={e => {
                                const perms = e.target.checked
                                  ? [...appConfig.permissions, perm]
                                  : appConfig.permissions.filter(p => p !== perm)
                                updateConfig('permissions', perms)
                              }}
                              className="rounded accent-[var(--primary)]"
                            />
                            {perm}
                          </label>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep('source')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleBuild} loading={loading} className="flex-2 flex-grow-[2]" icon={<Cpu size={15} />}>
                Start Build
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: BUILDING ───────────────────────────── */}
        {(step === 'building' || step === 'done') && build && (
          <motion.div
            key="building"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--text)] mb-1">
                  {step === 'done' && build.status === 'success' ? '🎉 Build Complete' :
                   step === 'done' ? '❌ Build Failed' : '⚙️ Building...'}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Build ID: <code className="text-xs bg-[var(--card)] px-1.5 py-0.5 rounded">{build.id}</code></p>
              </div>
              <StatusBadge status={build.status} />
            </div>

            <BuildLogs buildId={build.id} status={build.status} initialLogs={build.logs} />

            {/* Download */}
            {step === 'done' && build.status === 'success' && build.artifactUrl && (
              <Card className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Your APK is ready</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {build.artifactSize ? formatBytes(build.artifactSize) : ''} · Available for 24h
                  </p>
                </div>
                <Button
                  onClick={() => window.open(`/api/download/${build.id}`, '_blank')}
                  icon={<Settings2 size={14} />}
                >
                  Download APK
                </Button>
              </Card>
            )}

            {step === 'done' && (
              <Button
                variant="secondary"
                onClick={() => { setStep('source'); setBuild(null); setError('') }}
                className="w-full"
              >
                Start a new build
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
