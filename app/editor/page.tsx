'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sliders, Upload, Save, Smartphone, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { defaultAppConfig } from '@/lib/generators'
import { ANDROID_PERMISSIONS } from '@/types'
import type { AppConfig } from '@/types'

const FIELDS = [
  { key: 'appName',     label: 'App Name',     type: 'text',   placeholder: 'My App' },
  { key: 'packageName', label: 'Package Name',  type: 'text',   placeholder: 'com.example.myapp' },
  { key: 'versionName', label: 'Version Name',  type: 'text',   placeholder: '1.0.0' },
  { key: 'versionCode', label: 'Version Code',  type: 'number', placeholder: '1' },
  { key: 'minSdk',      label: 'Min SDK',       type: 'number', placeholder: '21' },
  { key: 'targetSdk',   label: 'Target SDK',    type: 'number', placeholder: '34' },
  { key: 'compileSdk',  label: 'Compile SDK',   type: 'number', placeholder: '34' },
]

export default function EditorPage() {
  const [config, setConfig] = useState<AppConfig>(defaultAppConfig())
  const [saved, setSaved] = useState(false)

  const update = (key: keyof AppConfig, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const save = () => {
    localStorage.setItem('lev:editor:config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const reset = () => {
    setConfig(defaultAppConfig())
    setSaved(false)
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
              <Sliders size={28} className="text-[var(--primary)]" />
              Visual Editor
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Configure Android app metadata. Saved configs are reused in your next build.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={reset}>Reset</Button>
            <Button size="sm" icon={<Save size={13} />} onClick={save} variant={saved ? 'success' : 'primary'}>
              {saved ? 'Saved!' : 'Save Config'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic fields */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Smartphone size={14} className="text-[var(--primary)]" />
                App Metadata
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={String(config[f.key as keyof AppConfig] ?? '')}
                      onChange={e => update(f.key as keyof AppConfig, f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                        text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Orientation + Display mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Orientation</label>
                  <select
                    value={config.orientation}
                    onChange={e => update('orientation', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    <option value="sensor">Auto</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Display Mode</label>
                  <select
                    value={config.displayMode ?? 'standalone'}
                    onChange={e => update('displayMode', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                      text-[var(--text)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                  >
                    <option value="standalone">Standalone</option>
                    <option value="fullscreen">Fullscreen</option>
                    <option value="minimal-ui">Minimal UI</option>
                    <option value="browser">Browser</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Icon upload */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)]">App Icon & Splash</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'icon', label: 'App Icon (512×512 PNG)' },
                  { key: 'splash', label: 'Splash Screen' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">{label}</label>
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] rounded-xl p-6 cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
                      {(config as unknown as Record<string, unknown>)[key] ? (
                        <img src={String((config as unknown as Record<string, unknown>)[key])} className="w-16 h-16 rounded-xl object-contain" alt={label} />
                      ) : (
                        <>
                          <Upload size={20} className="text-[var(--text-subtle)]" />
                          <span className="text-xs text-[var(--text-subtle)]">Upload PNG</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const reader = new FileReader()
                          reader.onload = () => update(key as keyof AppConfig, reader.result as string)
                          reader.readAsDataURL(f)
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Permissions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Permissions
                <span className="ml-2 text-xs font-normal text-[var(--text-subtle)]">({config.permissions.length} selected)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {ANDROID_PERMISSIONS.map(perm => (
                  <label key={perm} className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)] transition-colors py-1 px-1 rounded">
                    <input
                      type="checkbox"
                      checked={config.permissions.includes(perm)}
                      onChange={e => update('permissions', e.target.checked
                        ? [...config.permissions, perm]
                        : config.permissions.filter(p => p !== perm)
                      )}
                      className="rounded accent-[var(--primary)]"
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Website URL */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)]">Website / TWA URL</h2>
              <input
                type="url"
                value={config.url ?? ''}
                onChange={e => update('url', e.target.value)}
                placeholder="https://your-website.com"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)]
                  text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableZoom ?? false}
                  onChange={e => update('enableZoom', e.target.checked)}
                  className="rounded accent-[var(--primary)]"
                />
                Enable zoom in WebView
              </label>
            </Card>
          </motion.div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={save} className="flex-1" icon={<Save size={15} />} variant={saved ? 'success' : 'primary'}>
            {saved ? '✓ Config Saved' : 'Save Configuration'}
          </Button>
          <a href="/converter" className="flex-1">
            <Button variant="secondary" className="w-full">Use in Build →</Button>
          </a>
        </div>
      </div>
    </AppLayout>
  )
}
