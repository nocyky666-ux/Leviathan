import { NextRequest, NextResponse } from 'next/server'
import type { AnalyzeResponse, ProjectType } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Only ZIP files are supported' }, { status: 400 })
    }

    if (file.size > 52_428_800) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    // Read the ZIP file and scan file list using built-in ZIP parsing
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Simple ZIP central directory scan to list filenames
    const filenames = scanZipFilenames(bytes)

    // Detect project type from file structure
    const result = detectProjectType(filenames)

    return NextResponse.json(result)
  } catch (err) {
    console.error('[Analyze] Error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// PROJECT TYPE DETECTION
// ─────────────────────────────────────────────────────────────
function detectProjectType(files: string[]): AnalyzeResponse {
  const has = (pattern: string | RegExp) =>
    files.some(f => typeof pattern === 'string' ? f.includes(pattern) : pattern.test(f))

  const hasGradle = has('build.gradle') || has('build.gradle.kts')
  const hasManifest = has('AndroidManifest.xml')
  const hasPubspec = has('pubspec.yaml')
  const hasPackageJson = has('package.json')
  const hasCapacitorConfig = has('capacitor.config')
  const hasCordova = has('config.xml')
  const hasRN = hasPackageJson && (has('metro.config') || has('react-native.config'))
  const hasPWAManifest = has('manifest.json') || has('manifest.webmanifest')
  const hasServiceWorker = has('sw.js') || has('service-worker.js')

  // Flutter
  if (hasPubspec) {
    return {
      detected: 'flutter',
      confidence: 95,
      framework: 'Flutter',
      hasManifest, hasGradle, hasPubspec, hasPackageJson,
      suggestion: 'Flutter project detected. Will use flutter build command.',
    }
  }

  // React Native
  if (hasRN) {
    return {
      detected: 'react-native',
      confidence: 88,
      framework: 'React Native',
      hasManifest, hasGradle, hasPubspec, hasPackageJson,
      suggestion: 'React Native project. Build via Gradle in the android/ directory.',
    }
  }

  // Capacitor
  if (hasCapacitorConfig) {
    return {
      detected: 'capacitor',
      confidence: 90,
      framework: 'Capacitor',
      hasManifest, hasGradle, hasPubspec, hasPackageJson,
      suggestion: 'Capacitor project detected. Run npx cap sync before build.',
    }
  }

  // Cordova
  if (hasCordova) {
    return {
      detected: 'cordova',
      confidence: 85,
      framework: 'Cordova',
      hasManifest, hasGradle, hasPubspec, hasPackageJson,
      suggestion: 'Cordova project detected. Will use cordova build android.',
    }
  }

  // Native Android
  if (hasGradle && hasManifest) {
    return {
      detected: 'android-source',
      confidence: 92,
      framework: 'Android (Gradle)',
      hasManifest, hasGradle, hasPubspec, hasPackageJson,
      suggestion: 'Native Android project. Will use Gradle build directly.',
    }
  }

  // PWA
  if (hasPWAManifest && hasServiceWorker) {
    return {
      detected: 'pwa',
      confidence: 80,
      framework: 'PWA',
      hasManifest: false, hasGradle: false, hasPubspec: false, hasPackageJson,
      suggestion: 'PWA detected. Will wrap with TWA (Trusted Web Activity).',
    }
  }

  // Generic HTML/web
  if (has('.html') || has('index.html')) {
    return {
      detected: 'website',
      confidence: 65,
      framework: 'HTML/Web',
      hasManifest: false, hasGradle: false, hasPubspec: false, hasPackageJson,
      suggestion: 'Web project detected. Will wrap with TWA.',
    }
  }

  return {
    detected: 'zip',
    confidence: 40,
    framework: undefined,
    hasManifest, hasGradle, hasPubspec, hasPackageJson,
    suggestion: 'Could not auto-detect project type. Please select manually.',
  }
}

// ─────────────────────────────────────────────────────────────
// SIMPLE ZIP FILENAME SCANNER
// No external dependencies — reads ZIP central directory
// ─────────────────────────────────────────────────────────────
function scanZipFilenames(bytes: Uint8Array): string[] {
  const filenames: string[] = []
  const view = new DataView(bytes.buffer)

  let offset = 0
  while (offset < bytes.length - 4) {
    // Local file header signature: 0x04034b50
    if (
      view.getUint8(offset)     === 0x50 &&
      view.getUint8(offset + 1) === 0x4b &&
      view.getUint8(offset + 2) === 0x03 &&
      view.getUint8(offset + 3) === 0x04
    ) {
      const fileNameLength = view.getUint16(offset + 26, true)
      const extraFieldLength = view.getUint16(offset + 28, true)
      const compressedSize = view.getUint32(offset + 18, true)

      const nameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength)
      const name = new TextDecoder('utf-8', { fatal: false }).decode(nameBytes)
      if (name) filenames.push(name)

      offset += 30 + fileNameLength + extraFieldLength + compressedSize
    } else {
      offset++
    }

    // Safety: stop after 500 files
    if (filenames.length >= 500) break
  }

  return filenames
}
