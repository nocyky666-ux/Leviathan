/**
 * middleware.ts
 * Edge middleware: DDoS protection, rate limiting, security headers.
 * Pure in-memory — zero dependencies — free forever.
 * Works on Vercel Hobby plan.
 */
import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// RATE LIMIT CONFIG  (tuned for Vercel Hobby free tier)
// ─────────────────────────────────────────────────────────────
const WINDOW_MS       = 60_000   // 1-minute sliding window
const MAX_GENERAL     = 60       // general requests per window per IP
const MAX_BUILD       = 3        // build triggers per 5-min per IP
const BUILD_WINDOW_MS = 300_000
const MAX_ANALYZE     = 8
const STRIKE_BAN      = 5        // strikes → temporary ban
const BAN_SHORT_MS    = 1_800_000  // 30 min
const BAN_LONG_MS     = 3_600_000  // 1 hr (repeat offenders)

// ─────────────────────────────────────────────────────────────
// IN-MEMORY STORE  (resets on cold start — fine for free tier)
// ─────────────────────────────────────────────────────────────
type Entry = {
  count: number;       resetAt: number
  buildCount: number;  buildResetAt: number
  analyzeCount: number
  strikes: number
  bannedUntil: number
  totalStrikes: number  // persists within instance lifetime
}
const store = new Map<string, Entry>()

// Cleanup store every 5 min to prevent memory growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, e] of store) {
    if (now > e.resetAt && now > e.buildResetAt && e.bannedUntil < now) {
      store.delete(ip)
    }
  }
}, 300_000)

// ─────────────────────────────────────────────────────────────
// ATTACK SIGNATURES
// ─────────────────────────────────────────────────────────────
const ATTACK_RX = [
  /\.\.(\/|\\)/,          // path traversal
  /<script[\s>]/i,        // XSS
  /union\s+select/i,      // SQLi
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /javascript:/i,
  /vbscript:/i,
  /on\w+\s*=/i,           // event handler injection
  /data:text\/html/i,
  /\/etc\/passwd/i,
  /\/proc\/self/i,
  /\bwget\b|\bcurl\b.*http/i,
]

const BAD_AGENTS = [
  'sqlmap','nikto','nmap','masscan','zgrab','dirbuster',
  'gobuster','wfuzz','hydra','metasploit','openvas','nuclei',
  'acunetix','nessus','burp','zap','scrapy','python-urllib',
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function getIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    '0.0.0.0'
  )
}

function getEntry(ip: string): Entry {
  const now = Date.now()
  let e = store.get(ip)
  if (!e) {
    e = { count:0, resetAt: now+WINDOW_MS, buildCount:0, buildResetAt: now+BUILD_WINDOW_MS,
          analyzeCount:0, strikes:0, bannedUntil:0, totalStrikes:0 }
    store.set(ip, e)
  }
  if (now > e.resetAt) {
    e.count = 0; e.analyzeCount = 0; e.strikes = 0; e.resetAt = now + WINDOW_MS
  }
  if (now > e.buildResetAt) {
    e.buildCount = 0; e.buildResetAt = now + BUILD_WINDOW_MS
  }
  return e
}

function isAttack(req: NextRequest): boolean {
  const url = decodeURIComponent(req.url).toLowerCase()
  const ua  = (req.headers.get('user-agent') ?? '').toLowerCase()
  return ATTACK_RX.some(rx => rx.test(url)) ||
         BAD_AGENTS.some(b => ua.includes(b))
}

function deny(msg = 'Forbidden', status = 403): NextResponse {
  return new NextResponse(JSON.stringify({ error: msg }), {
    status, headers: { 'Content-Type': 'application/json' }
  })
}

function rateLimited(retryAfter: number): NextResponse {
  return new NextResponse(JSON.stringify({ error: 'Too many requests. Slow down.' }), {
    status: 429, headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(Math.ceil(retryAfter / 1000)),
      'X-RateLimit-Limit': String(MAX_GENERAL),
    }
  })
}

// ─────────────────────────────────────────────────────────────
// SECURITY HEADERS (CSP + HSTS + misc)
// ─────────────────────────────────────────────────────────────
function addSecurityHeaders(res: NextResponse): NextResponse {
  const h = res.headers
  h.set('X-DNS-Prefetch-Control',  'off')
  h.set('X-Frame-Options',         'DENY')
  h.set('X-Content-Type-Options',  'nosniff')
  h.set('X-XSS-Protection',        '1; mode=block')
  h.set('Referrer-Policy',         'strict-origin-when-cross-origin')
  h.set('Permissions-Policy',      'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  h.set('Strict-Transport-Security','max-age=63072000; includeSubDomains; preload')
  h.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.github.com",
    "worker-src blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '))
  h.delete('X-Powered-By')
  h.delete('Server')
  return res
}

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Static assets passthrough ─────────────────────────────
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.startsWith('/icons/')) {
    return addSecurityHeaders(NextResponse.next())
  }

  const ip  = getIP(req)
  const now = Date.now()

  // ── Attack detection → instant ban ────────────────────────
  if (isAttack(req)) {
    const e = getEntry(ip)
    e.totalStrikes++
    e.bannedUntil = now + (e.totalStrikes > 10 ? BAN_LONG_MS : BAN_SHORT_MS)
    return addSecurityHeaders(deny())
  }

  // ── Banned IP ──────────────────────────────────────────────
  const entry = getEntry(ip)
  if (entry.bannedUntil > now) {
    return addSecurityHeaders(deny('Access denied.'))
  }

  // ── API rate limiting ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Empty user-agent on API → likely bot
    const ua = req.headers.get('user-agent') ?? ''
    if (!ua || ua.length < 4) {
      entry.strikes++
      return addSecurityHeaders(deny('Bad request', 400))
    }

    entry.count++

    if (pathname.startsWith('/api/build')) {
      entry.buildCount++
      if (entry.buildCount > MAX_BUILD) {
        return addSecurityHeaders(rateLimited(entry.buildResetAt - now))
      }
    }

    if (pathname.startsWith('/api/analyze')) {
      entry.analyzeCount++
      if (entry.analyzeCount > MAX_ANALYZE) {
        return addSecurityHeaders(rateLimited(entry.resetAt - now))
      }
    }

    if (entry.count > MAX_GENERAL) {
      entry.strikes++
      entry.totalStrikes++
      if (entry.strikes >= STRIKE_BAN) {
        entry.bannedUntil = now + (entry.totalStrikes > 20 ? BAN_LONG_MS : BAN_SHORT_MS)
      }
      return addSecurityHeaders(rateLimited(entry.resetAt - now))
    }
  }

  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
