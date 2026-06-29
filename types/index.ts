// ─────────────────────────────────────────────────────────────
// BUILD TYPES
// ─────────────────────────────────────────────────────────────

export type BuildStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout'

export type ProjectType =
  | 'website'
  | 'pwa'
  | 'twa'
  | 'zip'
  | 'github'
  | 'flutter'
  | 'react-native'
  | 'capacitor'
  | 'cordova'
  | 'android-source'

export type OutputFormat = 'apk' | 'aab' | 'both'
export type BuildFlavor = 'debug' | 'release' | 'both'

export interface AppConfig {
  appName: string
  packageName: string
  versionName: string
  versionCode: number
  minSdk: number
  targetSdk: number
  compileSdk: number
  orientation: 'portrait' | 'landscape' | 'sensor'
  theme: string
  icon?: string         // base64
  splash?: string       // base64
  permissions: string[]
  deepLinks?: string[]
  // For website/PWA/TWA
  url?: string
  enableZoom?: boolean
  displayMode?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
}

export interface Build {
  id: string
  sessionId: string
  projectType: ProjectType
  outputFormat: OutputFormat
  buildFlavor: BuildFlavor
  status: BuildStatus
  appConfig: AppConfig
  // GitHub
  githubRunId?: string
  githubRepo?: string
  githubOwner?: string
  // Artifacts
  artifactUrl?: string
  artifactSize?: number
  // Logs
  logs?: string
  errorMessage?: string
  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
  queuePosition?: number
  estimatedSeconds?: number
}

export interface Project {
  id: string
  sessionId: string
  name: string
  type: ProjectType
  config: AppConfig
  builds: Build[]
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// API REQUEST / RESPONSE TYPES
// ─────────────────────────────────────────────────────────────

export interface BuildRequest {
  projectType: ProjectType
  outputFormat: OutputFormat
  buildFlavor: BuildFlavor
  appConfig: AppConfig
  // Input source (mutually exclusive)
  url?: string          // for website/pwa
  githubRepo?: string   // for github type: "owner/repo"
  // File upload handled via FormData
}

export interface BuildResponse {
  buildId: string
  status: BuildStatus
  message: string
  queuePosition?: number
  estimatedSeconds?: number
}

export interface StatusResponse {
  build: Build
  logs?: string[]
}

export interface DownloadResponse {
  url: string
  filename: string
  size: number
  expiresAt: string
}

export interface AnalyzeResponse {
  detected: ProjectType
  confidence: number
  framework?: string
  hasManifest: boolean
  hasGradle: boolean
  hasPubspec: boolean
  hasPackageJson: boolean
  suggestion: string
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR NAVIGATION
// ─────────────────────────────────────────────────────────────

export interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  badge?: string | number
}

// ─────────────────────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────────────────────

export interface SessionToken {
  sessionId: string
  createdAt: number
  expiresAt: number
}

// ─────────────────────────────────────────────────────────────
// PLUGIN TYPES
// ─────────────────────────────────────────────────────────────

export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  gradleDependency: string
  permissions?: string[]
  enabled: boolean
}

export const AVAILABLE_PLUGINS: Plugin[] = [
  {
    id: 'firebase-analytics',
    name: 'Firebase Analytics',
    description: 'Google Analytics for Firebase',
    version: '21.6.1',
    gradleDependency: "implementation 'com.google.firebase:firebase-analytics:21.6.1'",
    enabled: false,
  },
  {
    id: 'firebase-crashlytics',
    name: 'Firebase Crashlytics',
    description: 'Crash reporting',
    version: '18.6.3',
    gradleDependency: "implementation 'com.google.firebase:firebase-crashlytics:18.6.3'",
    enabled: false,
  },
  {
    id: 'onesignal',
    name: 'OneSignal Push',
    description: 'Push notifications via OneSignal',
    version: '5.1.6',
    gradleDependency: "implementation 'com.onesignal:OneSignal:5.1.6'",
    permissions: ['INTERNET', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
    enabled: false,
  },
  {
    id: 'biometric',
    name: 'Biometric Auth',
    description: 'Fingerprint/Face ID authentication',
    version: '1.2.0',
    gradleDependency: "implementation 'androidx.biometric:biometric:1.2.0'",
    permissions: ['USE_BIOMETRIC', 'USE_FINGERPRINT'],
    enabled: false,
  },
]

// ─────────────────────────────────────────────────────────────
// ANDROID PERMISSIONS
// ─────────────────────────────────────────────────────────────

export const ANDROID_PERMISSIONS = [
  'INTERNET',
  'ACCESS_NETWORK_STATE',
  'ACCESS_WIFI_STATE',
  'CAMERA',
  'READ_EXTERNAL_STORAGE',
  'WRITE_EXTERNAL_STORAGE',
  'ACCESS_FINE_LOCATION',
  'ACCESS_COARSE_LOCATION',
  'RECORD_AUDIO',
  'VIBRATE',
  'RECEIVE_BOOT_COMPLETED',
  'USE_BIOMETRIC',
  'USE_FINGERPRINT',
  'NFC',
  'BLUETOOTH',
  'READ_CONTACTS',
  'WRITE_CONTACTS',
  'READ_PHONE_STATE',
  'POST_NOTIFICATIONS',
]
