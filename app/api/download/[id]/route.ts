/**
 * app/api/download/[id]/route.ts
 * Proxy artifact download from GitHub + cleanup repo after download.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getBuild, updateBuild } from '@/lib/supabase'
import { getRunArtifacts, downloadArtifact, deleteRepo } from '@/lib/github'
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
  if (build.status !== 'success') {
    return NextResponse.json({ error: 'Build is not complete yet' }, { status: 409 })
  }
  if (!build.githubRepo || !build.githubOwner || !build.githubRunId) {
    return NextResponse.json({ error: 'Artifact info missing' }, { status: 404 })
  }

  try {
    const artifacts = await getRunArtifacts(
      build.githubOwner,
      build.githubRepo,
      parseInt(build.githubRunId)
    )

    if (!artifacts.length) {
      return NextResponse.json(
        { error: 'No artifact found. It may have expired (GitHub keeps them 1 day on free tier).' },
        { status: 404 }
      )
    }

    const artifact = artifacts[0]
    const buffer   = await downloadArtifact(build.githubOwner, build.githubRepo, artifact.id)

    const appName  = (build.appConfig?.appName ?? 'leviathan').replace(/\s+/g, '-').toLowerCase()
    const filename = `${appName}-${build.buildFlavor}.zip`

    // Schedule repo deletion after download (keeps GitHub clean & free)
    setImmediate(async () => {
      try {
        await deleteRepo(build.githubOwner!, build.githubRepo!)
      } catch {}
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(buffer.byteLength),
        'Cache-Control':       'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error(`[download/${params.id}]`, err)
    return NextResponse.json({ error: 'Failed to fetch artifact from GitHub' }, { status: 502 })
  }
}
