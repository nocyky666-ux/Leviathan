/**
 * lib/security.ts
 * Input validation, sanitization, and server-side security utilities.
 */

import { z } from 'zod'
import { generateSessionId } from './crypto'
import { SignJWT, jwtVerify } from 'jose'
import type { SessionToken } from '@/types'

// ─────────────────────────────────────────────────────────────
// ENV GUARD — fail fast if secrets are missing
// ─────────────────────────────────────────────────────────────
export function assertEnv() {
  const required = [
    'APP_SECRET',
    'ENCRYPTION_KEY',
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Check your .env.local file.'
    )
  }
}

// ─────────────────────────────────────────────────────────────
// JWT SESSION TOKENS (anonymous, no user data)
// ─────────────────────────────────────────────────────────────
function getSecret(): Uint8Array {
  const s = process.env.APP_SECRET
  if (!s || s.length < 32) throw new Error('APP_SECRET must be at least 32 characters')
  return new TextEncoder().encode(s)
}

const SESSION_TTL = 7 * 24 * 60 * 60 // 7 days in seconds

export async function createSessionToken(sessionId?: string): Promise<string> {
  const sid = sessionId ?? generateSessionId()
  return new SignJWT({ sessionId: sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .setIssuer('leviathan')
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionToken | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: 'leviathan' })
    return {
      sessionId: payload.sessionId as string,
      createdAt: (payload.iat ?? 0) * 1000,
      expiresAt: (payload.exp ?? 0) * 1000,
    }
  } catch {
    return null
  }
}

export function extractSessionFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie') ?? ''
  const match = cookie.match(/leviathan_session=([^;]+)/)
  return match?.[1] ?? null
}

// ─────────────────────────────────────────────────────────────
// GITHUB TOKEN — never exposed to client
// ─────────────────────────────────────────────────────────────
export function getGitHubToken(): string {
  const t = process.env.GITHUB_TOKEN
  if (!t) throw new Error('GITHUB_TOKEN not set')
  if (!t.startsWith('ghp_') && !t.startsWith('github_pat_') && !t.startsWith('gho_')) {
    throw new Error('GITHUB_TOKEN format appears invalid')
  }
  return t
}

export function getGitHubOwner(): string {
  const o = process.env.GITHUB_OWNER
  if (!o) throw new Error('GITHUB_OWNER not set')
  return o
}

// ─────────────────────────────────────────────────────────────
// INPUT VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────

const packageNameRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/
const versionNameRegex = /^\d+\.\d+\.\d+$/
const urlSchema = z.string().url().max(2048)

export const AppConfigSchema = z.object({
  appName: z.string().min(1).max(50).regex(/^[a-zA-Z0-9 _-]+$/, 'App name has invalid characters'),
  packageName: z.string().regex(packageNameRegex, 'Invalid Android package name (e.g. com.example.app)'),
  versionName: z.string().regex(versionNameRegex, 'Version must be x.y.z format'),
  versionCode: z.number().int().min(1).max(2_100_000_000),
  minSdk: z.number().int().min(21).max(34),
  targetSdk: z.number().int().min(33).max(34),
  compileSdk: z.number().int().min(33).max(34),
  orientation: z.enum(['portrait', 'landscape', 'sensor']),
  theme: z.string().max(100),
  icon: z.string().max(500_000).optional(),     // base64 image, ~375KB limit
  splash: z.string().max(500_000).optional(),
  permissions: z.array(z.string().max(100)).max(30),
  deepLinks: z.array(urlSchema).max(10).optional(),
  url: urlSchema.optional(),
  enableZoom: z.boolean().optional(),
  displayMode: z.enum(['standalone', 'fullscreen', 'minimal-ui', 'browser']).optional(),
})

export const BuildRequestSchema = z.object({
  projectType: z.enum(['website', 'pwa', 'twa', 'zip', 'github', 'flutter', 'react-native', 'capacitor', 'cordova', 'android-source']),
  outputFormat: z.enum(['apk', 'aab', 'both']),
  buildFlavor: z.enum(['debug', 'release', 'both']),
  appConfig: AppConfigSchema,
  url: urlSchema.optional(),
  githubRepo: z.string().regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 'Format: owner/repo').optional(),
})

// ─────────────────────────────────────────────────────────────
// SANITIZATION
// ─────────────────────────────────────────────────────────────

export function sanitizeString(input: unknown, maxLen = 255): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[<>'"&]/g, '')     // strip HTML/SQL injection chars
    .replace(/\0/g, '')           // strip null bytes
    .trim()
    .slice(0, maxLen)
}

export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  try {
    const u = new URL(input.trim())
    if (!['http:', 'https:'].includes(u.protocol)) return null
    if (u.hostname === 'localhost' || u.hostname.startsWith('127.') || u.hostname.startsWith('192.168.')) return null
    return u.toString()
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────
// UPLOAD VALIDATION
// ─────────────────────────────────────────────────────────────

const MAX_UPLOAD = parseInt(process.env.MAX_UPLOAD_SIZE ?? '52428800')  // 50MB default
const ALLOWED_MIME = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
const ALLOWED_EXT = ['.zip']

export function validateUploadedFile(file: File): { ok: boolean; error?: string } {
  if (file.size > MAX_UPLOAD) {
    return { ok: false, error: `File too large. Max size is ${MAX_UPLOAD / 1_048_576}MB.` }
  }
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) {
    return { ok: false, error: 'Only .zip files are accepted.' }
  }
  // Check MIME (untrusted but useful first filter)
  if (!ALLOWED_MIME.includes(file.type) && file.type !== '') {
    return { ok: false, error: 'Invalid file type.' }
  }
  return { ok: true }
}

// ─────────────────────────────────────────────────────────────
// BUILD ID VALIDATION
// ─────────────────────────────────────────────────────────────
export function isValidBuildId(id: string): boolean {
  return /^bld_[a-f0-9]{32}$/.test(id)
}

export function isValidSessionId(id: string): boolean {
  return /^[a-zA-Z0-9]{20,40}$/.test(id)
}
