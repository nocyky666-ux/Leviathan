'use client'
import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GitBranch, ArrowRight } from 'lucide-react'
export default function RepoBuilderPage() {
  const [repo, setRepo] = useState('')
  return (
    <AppLayout>
      <div className="max-w-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3"><GitBranch size={28} className="text-[var(--primary)]" />Repository Builder</h1>
          <p className="text-sm text-[var(--text-muted)]">Build directly from any public GitHub repository.</p>
        </div>
        <Card className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">GitHub Repository</label>
            <input type="text" value={repo} onChange={e => setRepo(e.target.value)} placeholder="owner/repository" className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
            <p className="text-xs text-[var(--text-subtle)] mt-1">Format: <code>username/repo-name</code></p>
          </div>
          <a href={repo ? `/converter?type=github&repo=${encodeURIComponent(repo)}` : '#'}>
            <Button className="w-full" disabled={!repo} iconRight={<ArrowRight size={15} />}>Continue to Build</Button>
          </a>
        </Card>
      </div>
    </AppLayout>
  )
}
