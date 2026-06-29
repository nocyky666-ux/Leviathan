'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Key, Shield, Trash2, Info,
  ExternalLink, Copy, Check, AlertTriangle,
} from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { getSessionId } from '@/lib/utils'

function CopySnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className="terminal text-xs p-4 rounded-xl overflow-x-auto">{code}</pre>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(code)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-gray-400" />}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [confirmClear, setConfirmClear] = useState(false)
  const sessionId = typeof window !== 'undefined' ? getSessionId() : '...'

  const clearSession = () => {
    if (confirmClear) {
      localStorage.clear()
      window.location.reload()
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
            <Settings size={28} className="text-[var(--primary)]" />
            Settings
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Configure your Leviathan instance.</p>
        </div>

        <div className="space-y-6">
          {/* ── Appearance ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Info size={15} className="text-[var(--primary)]" />
                Appearance
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text)]">Theme</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Switch between light and dark mode</p>
                </div>
                <ThemeToggle />
              </div>
            </Card>
          </motion.div>

          {/* ── Session ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Key size={15} className="text-[var(--primary)]" />
                Session
              </h2>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Your anonymous session ID</p>
                <code className="text-xs bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-lg block text-[var(--text-muted)] font-mono">
                  {sessionId}
                </code>
                <p className="text-xs text-[var(--text-subtle)] mt-1.5">
                  This ID is stored only in your browser. It links you to your builds anonymously.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--border)]">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={13} />}
                  onClick={clearSession}
                >
                  {confirmClear ? 'Click again to confirm' : 'Clear Session & Local Data'}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* ── Environment Setup ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="space-y-5">
              <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Shield size={15} className="text-[var(--primary)]" />
                Environment Setup Guide
              </h2>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/15">
                <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  These keys should only be set in Vercel's environment variable dashboard or your <code>.env.local</code> file.
                  <strong> Never commit secrets to Git.</strong>
                </p>
              </div>

              {/* Step 1: Supabase */}
              <div>
                <p className="text-xs font-semibold text-[var(--text)] mb-2">1. Create a Supabase project</p>
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  Go to{' '}
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline inline-flex items-center gap-0.5">
                    supabase.com <ExternalLink size={10} />
                  </a>
                  {' '}→ New Project → SQL Editor → paste the contents of <code>supabase/schema.sql</code>.
                </p>
                <CopySnippet code={`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`} />
              </div>

              {/* Step 2: GitHub PAT */}
              <div>
                <p className="text-xs font-semibold text-[var(--text)] mb-2">2. Create a GitHub Personal Access Token</p>
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  Go to GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained tokens.
                  Grant: <strong>Contents</strong> (read/write), <strong>Actions</strong> (read/write), <strong>Administration</strong> (write).
                </p>
                <CopySnippet code={`GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-github-username`} />
              </div>

              {/* Step 3: Secrets */}
              <div>
                <p className="text-xs font-semibold text-[var(--text)] mb-2">3. Generate security secrets</p>
                <CopySnippet code={`# Run in your terminal:
openssl rand -base64 32   # → APP_SECRET
openssl rand -hex 32      # → ENCRYPTION_KEY
openssl rand -base64 32   # → WEBHOOK_SECRET`} />
              </div>

              {/* Step 4: Deploy */}
              <div>
                <p className="text-xs font-semibold text-[var(--text)] mb-2">4. Deploy to Vercel</p>
                <CopySnippet code={`# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables via Vercel dashboard:
# vercel.com/[your-project]/settings/environment-variables`} />
              </div>
            </Card>
          </motion.div>

          {/* ── About ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">About</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Product', 'Leviathan'],
                  ['Author', 'Dev Noctky'],
                  ['Version', '1.0.0'],
                  ['Build Engine', 'GitHub Actions'],
                  ['Frontend', 'Next.js 14'],
                  ['Database', 'Supabase (PostgreSQL)'],
                  ['Hosting', 'Vercel Edge'],
                  ['License', 'MIT'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[var(--text-subtle)]">{label}</p>
                    <p className="text-[var(--text-muted)] font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
