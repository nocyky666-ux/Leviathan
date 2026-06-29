import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  // Check Supabase
  try {
    const db = getSupabaseServer()
    const { error } = await db.from('builds').select('id').limit(1)
    checks.supabase = error ? 'error' : 'ok'
  } catch {
    checks.supabase = 'error'
  }

  // Check GitHub token present
  checks.github = process.env.GITHUB_TOKEN ? 'ok' : 'error'
  checks.encryption = process.env.ENCRYPTION_KEY ? 'ok' : 'error'

  const allOk = Object.values(checks).every(v => v === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
      checks,
      ts: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
