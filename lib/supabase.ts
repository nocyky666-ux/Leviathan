/**
 * lib/supabase.ts
 * Supabase client factory.
 * - Browser client: uses anon key (respects Row Level Security)
 * - Server client: uses service role key (bypasses RLS for internal operations)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Build, Project } from '@/types'

// ─────────────────────────────────────────────────────────────
// BROWSER CLIENT (anon key — safe to use in React components)
// ─────────────────────────────────────────────────────────────
let browserClient: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase URL/anon key not configured')
  browserClient = createClient(url, key, {
    auth: { persistSession: false },
  })
  return browserClient
}

// ─────────────────────────────────────────────────────────────
// SERVER CLIENT (service role — only use in API routes / server)
// ─────────────────────────────────────────────────────────────
export function getSupabaseServer(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server credentials not configured')
  // New instance per request (no shared state server-side)
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ─────────────────────────────────────────────────────────────
// BUILD OPERATIONS (server-side)
// ─────────────────────────────────────────────────────────────

export async function createBuild(build: Omit<Build, 'id' | 'createdAt' | 'updatedAt'>): Promise<Build> {
  const db = getSupabaseServer()
  const { data, error } = await db
    .from('builds')
    .insert({
      session_id: build.sessionId,
      project_type: build.projectType,
      output_format: build.outputFormat,
      build_flavor: build.buildFlavor,
      status: build.status,
      app_config: build.appConfig,
      github_run_id: build.githubRunId,
      github_repo: build.githubRepo,
      github_owner: build.githubOwner,
    })
    .select()
    .single()
  if (error) throw error
  return mapBuild(data)
}

export async function updateBuild(id: string, updates: Partial<Build>): Promise<void> {
  const db = getSupabaseServer()
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.githubRunId !== undefined) dbUpdates.github_run_id = updates.githubRunId
  if (updates.githubRepo !== undefined) dbUpdates.github_repo = updates.githubRepo
  if (updates.githubOwner !== undefined) dbUpdates.github_owner = updates.githubOwner
  if (updates.artifactUrl !== undefined) dbUpdates.artifact_url = updates.artifactUrl
  if (updates.artifactSize !== undefined) dbUpdates.artifact_size = updates.artifactSize
  if (updates.logs !== undefined) dbUpdates.logs = updates.logs
  if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt

  const { error } = await db.from('builds').update(dbUpdates).eq('id', id)
  if (error) throw error
}

export async function getBuild(id: string): Promise<Build | null> {
  const db = getSupabaseServer()
  const { data, error } = await db.from('builds').select('*').eq('id', id).single()
  if (error || !data) return null
  return mapBuild(data)
}

export async function getBuildsForSession(sessionId: string, limit = 20): Promise<Build[]> {
  const db = getSupabaseServer()
  const { data, error } = await db
    .from('builds')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(mapBuild)
}

export async function getQueuePosition(buildId: string): Promise<number> {
  const db = getSupabaseServer()
  const { count } = await db
    .from('builds')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'queued'])
    .lt('created_at', new Date().toISOString())
  return (count ?? 0) + 1
}

// ─────────────────────────────────────────────────────────────
// ROW MAPPER
// ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBuild(row: any): Build {
  return {
    id: row.id,
    sessionId: row.session_id,
    projectType: row.project_type,
    outputFormat: row.output_format,
    buildFlavor: row.build_flavor,
    status: row.status,
    appConfig: row.app_config,
    githubRunId: row.github_run_id,
    githubRepo: row.github_repo,
    githubOwner: row.github_owner,
    artifactUrl: row.artifact_url,
    artifactSize: row.artifact_size,
    logs: row.logs,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }
}
