'use client'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { GitCompare } from 'lucide-react'
export default function DiffPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3"><GitCompare size={28} className="text-[var(--primary)]" />APK Diff Viewer</h1>
        <p className="text-sm text-[var(--text-muted)]">Compare two builds side-by-side. Coming soon.</p>
      </div>
      <Card className="text-center py-16">
        <GitCompare size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-muted)]">APK Diff Viewer</p>
        <p className="text-xs text-[var(--text-subtle)] mt-1">Compare permissions, resources, dependencies, and size between two builds.</p>
        <p className="text-xs text-[var(--primary)] mt-3 font-medium">Coming in v1.1</p>
      </Card>
    </AppLayout>
  )
}
