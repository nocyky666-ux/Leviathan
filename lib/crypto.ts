/**
 * lib/crypto.ts
 * Server-side encryption/decryption using Web Crypto API (edge-compatible).
 * Protects sensitive data at rest (e.g., GitHub tokens stored in Supabase).
 */

const ALG = 'AES-GCM'
const KEY_LENGTH = 256

function hexToBuffer(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bufferToHex(buf: ArrayBuffer | Uint8Array<ArrayBufferLike>): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function bufferToBase64(buf: ArrayBuffer | Uint8Array<ArrayBufferLike>): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return Buffer.from(arr).toString('base64url')
}

function base64ToBuffer(b64: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(b64, 'base64url'))
}

async function getKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex || keyHex.length < 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)')
  }
  const raw = hexToBuffer(keyHex)
  return crypto.subtle.importKey('raw', raw, { name: ALG }, false, ['encrypt', 'decrypt'])
}

/**
 * Encrypt a plaintext string.
 * Returns "iv.ciphertext" in base64url format.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBuf = await crypto.subtle.encrypt({ name: ALG, iv }, key, encoded)
  return `${bufferToBase64(iv)}.${bufferToBase64(cipherBuf)}`
}

/**
 * Decrypt a "iv.ciphertext" string produced by encrypt().
 */
export async function decrypt(payload: string): Promise<string> {
  const key = await getKey()
  const [ivB64, cipherB64] = payload.split('.')
  if (!ivB64 || !cipherB64) throw new Error('Invalid encrypted payload')
  const iv = base64ToBuffer(ivB64)
  const cipher = base64ToBuffer(cipherB64)
  const plainBuf = await crypto.subtle.decrypt({ name: ALG, iv }, key, cipher)
  return new TextDecoder().decode(plainBuf)
}

/**
 * Generate a secure random session ID (URL-safe, 32 chars).
 */
export function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24)) as Uint8Array<ArrayBuffer>
  return bufferToBase64(bytes).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}

/**
 * Generate a secure random build ID.
 */
export function generateBuildId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>
  return `bld_${bufferToHex(bytes)}`
}

/**
 * Compute HMAC-SHA256 signature for webhook verification.
 */
export async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return `sha256=${bufferToHex(sig)}`
}

/**
 * Verify HMAC-SHA256 signature (timing-safe).
 */
export async function hmacVerify(payload: string, secret: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload, secret)
  if (expected.length !== signature.length) return false
  // Timing-safe comparison
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Hash a string with SHA-256 (for de-duplication, not passwords).
 */
export async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return bufferToHex(buf)
}
