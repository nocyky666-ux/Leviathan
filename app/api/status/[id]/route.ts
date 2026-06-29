/**
 * app/api/status/[id]/route.ts
 * Poll build status + trigger artifact download on success.
 * Compatible with Vercel Hobby 25s timeout.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getBuild, updateBuild } from '@/lib/supabase'
import { pollBuildStatus, deleteRepo } from '@/lib/github'
import { isValidBuildId } from '@/lib/security'

export const runtime     = 'nodejs'
export const maxDuration = 25

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isValidBuildId(params.id)) {
    return NextResponse.json({ error: 'Invalid build ID' }, { status: 400 })
  }

  const build = await getBuild(params.id)
  if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

  // If still running — check GitHub
  if (
    build.status === 'running' &&
    build.githubRunId && build.githubRepo && build.githubOwner
  ) {
    try {
      const gh = await pollBuildStatus(
        build.githubOwner,
        build.githubRepo,
        parseInt(build.githubRunId)
      )

      if (gh.status === 'success') {
        await updateBuild(params.id, {
          status:       'success',
          artifactUrl:  `/api/download/${params.id}`,
          artifactSize: gh.artifactSize,
          completedAt:  new Date().toISOString(),
        })
      } else if (gh.status === 'failed') {
        await updateBuild(params.id, {
          status: 'failed',
          errorMessage: 'Build failed. View logs on GitHub Actions.',
          completedAt: new Date().toISOString(),
        })
        // Cleanup repo on failure too
        deleteRepo(build.githubOwner, build.githubRepo).catch(() => {})
      } else if (gh.status === 'cancelled') {
        await updateBuild(params.id, { status: 'cancelled', completedAt: new Date().toISOString() })
      }
    } catch (err) {
      console.error(`[status/${params.id}] GitHub poll error:`, err)
    }
  }

  const latest = await getBuild(params.id)
  return NextResponse.json({ build: latest })
}
