/**
 * lib/github.ts
 * GitHub Actions build engine — optimised for FREE TIER.
 *
 * Strategy:
 *  - Repos are created as PUBLIC → unlimited free Actions minutes
 *  - Repos are auto-deleted after the artifact is downloaded (or after TTL)
 *  - Artifacts live in GitHub for 1 day (free, no external storage needed)
 *  - All API calls non-blocking → Vercel Hobby 30s function limit respected
 */

import { Octokit } from 'octokit'
import { getGitHubToken, getGitHubOwner } from './security'
import { generateWorkflow, generateTWAProject } from './generators'
import type { AppConfig, BuildFlavor, OutputFormat, ProjectType } from '@/types'

// ─────────────────────────────────────────────────────────────
// OCTOKIT
// ─────────────────────────────────────────────────────────────
function octokit() {
  return new Octokit({ auth: getGitHubToken() })
}

// ─────────────────────────────────────────────────────────────
// CREATE TEMPORARY BUILD REPO
// PUBLIC = unlimited free Actions minutes on GitHub Free plan
// ─────────────────────────────────────────────────────────────
export async function createBuildRepo(buildId: string): Promise<{ owner: string; repo: string }> {
  const kit  = octokit()
  const owner = getGitHubOwner()
  // Unique short name to avoid collisions
  const repoName = `lev-${buildId.replace('bld_', '').slice(0, 12)}-${Date.now().toString(36)}`

  const usePublic = process.env.USE_PUBLIC_REPOS !== 'false'  // default: public

  await kit.rest.repos.createForAuthenticatedUser({
    name:        repoName,
    private:     !usePublic,   // PUBLIC = unlimited free Actions minutes
    auto_init:   false,
    description: `Leviathan temp build — ${buildId}`,
    has_issues:        false,
    has_projects:      false,
    has_wiki:          false,
    has_downloads:     false,
  })

  return { owner, repo: repoName }
}

// ─────────────────────────────────────────────────────────────
// PUSH FILES TO REPO (one by one to avoid secondary rate limits)
// ─────────────────────────────────────────────────────────────
async function pushFile(
  kit: Octokit, owner: string, repo: string,
  path: string, content: string
): Promise<void> {
  await kit.rest.repos.createOrUpdateFileContents({
    owner, repo, path,
    message: `build: ${path}`,
    content: Buffer.from(content).toString('base64'),
  })
}

export async function pushProjectFiles(
  owner: string, repo: string,
  files: Record<string, string>,
  workflowYaml: string
): Promise<void> {
  const kit = octokit()
  const entries = Object.entries(files)

  // Batch-push project files with small delays to stay under secondary rate limits
  for (const [path, content] of entries) {
    await pushFile(kit, owner, repo, path, content)
    await sleep(150)
  }

  // Push workflow last
  await pushFile(kit, owner, repo, '.github/workflows/build.yml', workflowYaml)
}

// ─────────────────────────────────────────────────────────────
// TRIGGER WORKFLOW DISPATCH
// ─────────────────────────────────────────────────────────────
export async function triggerWorkflow(owner: string, repo: string): Promise<void> {
  const kit = octokit()
  await kit.rest.actions.createWorkflowDispatch({
    owner, repo,
    workflow_id: 'build.yml',
    ref: 'main',
  })
}

// ─────────────────────────────────────────────────────────────
// POLL STATUS
// ─────────────────────────────────────────────────────────────
export async function getLatestRun(owner: string, repo: string): Promise<{
  id: number; status: string; conclusion: string | null
} | null> {
  try {
    const kit = octokit()
    const { data } = await kit.rest.actions.listWorkflowRuns({
      owner, repo, workflow_id: 'build.yml', per_page: 1,
    })
    const run = data.workflow_runs[0]
    if (!run) return null
    return { id: run.id, status: run.status ?? 'unknown', conclusion: run.conclusion }
  } catch {
    return null
  }
}

export async function pollBuildStatus(owner: string, repo: string, runId: number): Promise<{
  status: 'running' | 'success' | 'failed' | 'cancelled'
  artifactId?: number
  artifactSize?: number
}> {
  const kit = octokit()
  const { data: run } = await kit.rest.actions.getWorkflowRun({ owner, repo, run_id: runId })

  if (run.status !== 'completed') return { status: 'running' }

  if (run.conclusion === 'success') {
    const { data } = await kit.rest.actions.listWorkflowRunArtifacts({ owner, repo, run_id: runId })
    const artifact = data.artifacts[0]
    return { status: 'success', artifactId: artifact?.id, artifactSize: artifact?.size_in_bytes }
  }

  return { status: run.conclusion === 'cancelled' ? 'cancelled' : 'failed' }
}

// ─────────────────────────────────────────────────────────────
// DOWNLOAD ARTIFACT (returns raw ZIP buffer)
// ─────────────────────────────────────────────────────────────
export async function downloadArtifact(owner: string, repo: string, artifactId: number): Promise<Buffer> {
  const kit = octokit()
  const response = await kit.rest.actions.downloadArtifact({
    owner, repo, artifact_id: artifactId, archive_format: 'zip',
  })
  return Buffer.from(response.data as ArrayBuffer)
}

export async function getRunArtifacts(owner: string, repo: string, runId: number) {
  const kit = octokit()
  const { data } = await kit.rest.actions.listWorkflowRunArtifacts({ owner, repo, run_id: runId })
  return data.artifacts.map(a => ({ id: a.id, name: a.name, size: a.size_in_bytes }))
}

// ─────────────────────────────────────────────────────────────
// DELETE REPO (cleanup — called after download or TTL)
// ─────────────────────────────────────────────────────────────
export async function deleteRepo(owner: string, repo: string): Promise<void> {
  try {
    const kit = octokit()
    await kit.rest.repos.delete({ owner, repo })
    console.log(`[GitHub] Deleted temp repo: ${owner}/${repo}`)
  } catch (err) {
    console.error(`[GitHub] Failed to delete ${owner}/${repo}:`, err)
  }
}

// ─────────────────────────────────────────────────────────────
// ORCHESTRATE BUILD (non-blocking — returns immediately with run info)
// Designed to fit within Vercel Hobby 30s function timeout.
// ─────────────────────────────────────────────────────────────
export async function orchestrateBuild(params: {
  buildId: string
  projectType: ProjectType
  outputFormat: OutputFormat
  buildFlavor: BuildFlavor
  appConfig: AppConfig
  onStatusUpdate?: (status: string, extra?: Record<string, unknown>) => Promise<void>
}): Promise<{ runId: number; owner: string; repo: string }> {
  const { buildId, projectType, outputFormat, buildFlavor, appConfig, onStatusUpdate } = params

  // 1 — Create repo
  await onStatusUpdate?.('queued')
  const { owner, repo } = await createBuildRepo(buildId)

  // 2 — Generate + push files
  const files    = generateTWAProject(appConfig)
  const workflow = generateWorkflow(projectType, outputFormat, buildFlavor)
  await pushProjectFiles(owner, repo, files, workflow)

  // 3 — Trigger workflow
  await triggerWorkflow(owner, repo)
  await onStatusUpdate?.('running', { githubRepo: repo, githubOwner: owner })

  // 4 — Wait for run ID (up to 30s — fits Hobby timeout)
  let runId: number | null = null
  for (let i = 0; i < 8; i++) {
    await sleep(3000)
    const run = await getLatestRun(owner, repo)
    if (run?.id) { runId = run.id; break }
  }

  if (!runId) {
    // Cleanup and fail
    await deleteRepo(owner, repo)
    throw new Error('GitHub Actions workflow did not start. Check your GitHub PAT permissions.')
  }

  // Schedule TTL cleanup (fire and forget)
  const ttl = parseInt(process.env.REPO_TTL_HOURS ?? '1') * 3_600_000
  setTimeout(() => deleteRepo(owner, repo), ttl)

  return { runId, owner, repo }
}

// ─────────────────────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
