/**
 * app/api/build/route.ts
 * Kick off a build — non-blocking, returns build ID immediately.
 * Compatible with Vercel Hobby 30s function timeout.
 */
import { NextRequest, NextResponse } from 'next/server'
import { BuildRequestSchema, isValidSessionId, validateUploadedFile } from '@/lib/security'
import { createBuild, updateBuild } from '@/lib/supabase'
import { orchestrateBuild } from '@/lib/github'
import { generateBuildId } from '@/lib/crypto'
import { defaultAppConfig } from '@/lib/generators'

export const runtime  = 'nodejs'
export const maxDuration = 30   // Vercel Hobby max

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null)
    if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

    const sessionId = (formData.get('sessionId') as string) ?? ''
    if (!isValidSessionId(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    // Parse + validate
    const raw = {
      projectType:  formData.get('projectType'),
      outputFormat: formData.get('outputFormat'),
      buildFlavor:  formData.get('buildFlavor'),
      url:          formData.get('url') ?? undefined,
      githubRepo:   formData.get('githubRepo') ?? undefined,
      appConfig: (() => {
        try { return JSON.parse(formData.get('appConfig') as string) }
        catch { return defaultAppConfig() }
      })(),
    }

    const parsed = BuildRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { projectType, outputFormat, buildFlavor, appConfig, url, githubRepo } = parsed.data

    if (['website','pwa','twa'].includes(projectType) && !url) {
      return NextResponse.json({ error: 'URL required for website/PWA builds' }, { status: 422 })
    }
    if (projectType === 'github' && !githubRepo) {
      return NextResponse.json({ error: 'GitHub repo required' }, { status: 422 })
    }

    const file = formData.get('file') as File | null
    if (['zip','flutter','capacitor','cordova','android-source','react-native'].includes(projectType) && !file) {
      return NextResponse.json({ error: 'File upload required for this project type' }, { status: 422 })
    }
    if (file) {
      const { ok, error } = validateUploadedFile(file)
      if (!ok) return NextResponse.json({ error }, { status: 422 })
    }

    // Create build record
    const finalConfig = { ...appConfig, url }
    const build = await createBuild({
      sessionId, projectType, outputFormat, buildFlavor,
      status: 'pending', appConfig: finalConfig,
    })

    // Start build async (fire and forget — response returns immediately)
    void runBuildAsync(build.id, { projectType, outputFormat, buildFlavor, appConfig: finalConfig, githubRepo })
      .catch(err => {
        updateBuild(build.id, {
          status: 'failed',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          completedAt: new Date().toISOString(),
        }).catch(() => {})
      })

    return NextResponse.json({
      buildId:  build.id,
      status:   'pending',
      message:  'Build queued — poll /api/status/:id for progress.',
    })

  } catch (err) {
    console.error('[/api/build]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// ASYNC BUILD RUNNER
// Runs outside the HTTP request lifecycle (edge async).
// ─────────────────────────────────────────────────────────────
async function runBuildAsync(buildId: string, params: {
  projectType: string; outputFormat: string; buildFlavor: string
  appConfig: Record<string, unknown>; githubRepo?: string
}) {
  const result = await orchestrateBuild({
    buildId,
    projectType:  params.projectType  as never,
    outputFormat: params.outputFormat as never,
    buildFlavor:  params.buildFlavor  as never,
    appConfig:    params.appConfig    as never,
    onStatusUpdate: async (status, extra) => {
      await updateBuild(buildId, { status: status as never, ...extra as never })
    },
  })

  await updateBuild(buildId, {
    githubRunId:  String(result.runId),
    githubRepo:   result.repo,
    githubOwner:  result.owner,
    status:       'running',
  })
}
