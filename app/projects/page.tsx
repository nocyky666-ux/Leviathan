'use client'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'
import { FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
export default function ProjectsPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3"><FolderOpen size={28} className="text-[var(--primary)]" />Projects</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your build projects. Projects are session-scoped and stored for 7 days.</p>
      </div>
      <Card className="text-center py-16">
        <FolderOpen size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-muted)]">No projects yet</p>
        <p className="text-xs text-[var(--text-subtle)] mt-1 mb-4">Create your first project to save build configurations.</p>
        <Link href="/converter"><Button size="sm">New Project</Button></Link>
      </Card>
    </AppLayout>
  )
}
