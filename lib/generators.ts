/**
 * lib/generators.ts
 * Android project file generators + GitHub Actions workflows.
 * Generates valid Gradle/TWA projects that build on free GitHub Actions runners.
 */

import type { AppConfig, BuildFlavor, OutputFormat, ProjectType } from '@/types'

// ─────────────────────────────────────────────────────────────
// GITHUB ACTIONS WORKFLOW GENERATOR
// Produces .github/workflows/build.yml
// Optimised for free GitHub Actions (ubuntu-latest, 2-core)
// ─────────────────────────────────────────────────────────────
export function generateWorkflow(
  projectType: ProjectType,
  outputFormat: OutputFormat,
  buildFlavor: BuildFlavor
): string {
  const isFlutter  = projectType === 'flutter'
  const isAAB      = outputFormat === 'aab'
  const isRelease  = buildFlavor === 'release'

  if (isFlutter) {
    const flutterCmd = isAAB ? 'appbundle' : 'apk'
    const buildMode  = isRelease ? '--release' : '--debug'
    return `name: Build Flutter APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: stable
          channel: stable
          cache: true

      - name: Get dependencies
        run: flutter pub get

      - name: Build
        run: flutter build ${flutterCmd} ${buildMode}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: leviathan-build
          path: |
            build/app/outputs/flutter-apk/*.apk
            build/app/outputs/bundle/**/*.aab
          retention-days: 1
          if-no-files-found: error
`
  }

  // Gradle-based (TWA / Android Source / Capacitor / Cordova / React Native)
  const gradleTask = isAAB
    ? (isRelease ? 'bundleRelease' : 'bundleDebug')
    : (isRelease ? 'assembleRelease' : 'assembleDebug')

  const artifactPath = isAAB
    ? 'app/build/outputs/bundle/**/*.aab'
    : 'app/build/outputs/apk/**/*.apk'

  return `name: Build Android APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: temurin
          cache: gradle

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Accept Android SDK licenses
        run: yes | sdkmanager --licenses || true

      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-\${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: gradle-

      - name: Make gradlew executable
        run: chmod +x ./gradlew

      - name: Build
        run: ./gradlew ${gradleTask} --no-daemon --stacktrace

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: leviathan-build
          path: ${artifactPath}
          retention-days: 1
          if-no-files-found: error
`
}

// ─────────────────────────────────────────────────────────────
// TWA (Trusted Web Activity) PROJECT GENERATOR
// Generates a complete Android Gradle project that wraps a URL.
// Uses official Google TWA library (no paid dependencies).
// ─────────────────────────────────────────────────────────────
export function generateTWAProject(config: AppConfig): Record<string, string> {
  const {
    appName, packageName, versionName, versionCode,
    minSdk, targetSdk, compileSdk,
    url = 'https://example.com',
    permissions = [], orientation = 'sensor',
  } = config

  const host        = (() => { try { return new URL(url).hostname } catch { return 'example.com' } })()
  const safeAppName = appName.replace(/[^a-zA-Z0-9]/g, '')
  const permsXml    = [...new Set(['INTERNET', 'ACCESS_NETWORK_STATE', ...permissions])]
    .map(p => `    <uses-permission android:name="android.permission.${p}" />`)
    .join('\n')

  return {
    // ── Gradle wrapper ───────────────────────────────────────
    'gradle/wrapper/gradle-wrapper.properties':
`distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,

    // ── gradlew script (minimal, enough for CI) ──────────────
    'gradlew':
`#!/bin/sh
exec gradle "$@"
`,

    // ── Root settings.gradle ─────────────────────────────────
    'settings.gradle':
`pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${safeAppName}"
include ':app'
`,

    // ── Root build.gradle ────────────────────────────────────
    'build.gradle':
`plugins {
    id 'com.android.application' version '8.2.2' apply false
}
`,

    // ── App build.gradle ─────────────────────────────────────
    'app/build.gradle':
`plugins {
    id 'com.android.application'
}

android {
    namespace '${packageName}'
    compileSdk ${compileSdk}

    defaultConfig {
        applicationId '${packageName}'
        minSdk ${minSdk}
        targetSdk ${targetSdk}
        versionCode ${versionCode}
        versionName '${versionName}'
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
}
`,

    // ── AndroidManifest.xml ──────────────────────────────────
    'app/src/main/AndroidManifest.xml':
`<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

${permsXml}

    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
        </intent>
    </queries>

    <application
        android:label="${appName}"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.${safeAppName}"
        android:allowBackup="true"
        android:supportsRtl="true">

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true"
            android:screenOrientation="${orientation}">

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="${url}" />

            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.FALLBACK_STRATEGY"
                android:value="customtabs" />

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${host}" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,

    // ── Resources ────────────────────────────────────────────
    'app/src/main/res/values/strings.xml':
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>
`,

    'app/src/main/res/values/colors.xml':
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#5B5BD6</color>
    <color name="colorPrimaryDark">#4A4AB8</color>
    <color name="colorAccent">#7C8CFF</color>
</resources>
`,

    'app/src/main/res/values/themes.xml':
`<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.${safeAppName}" parent="Theme.MaterialComponents.Light.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryVariant">@color/colorPrimaryDark</item>
        <item name="colorSecondary">@color/colorAccent</item>
        <item name="android:statusBarColor">@color/colorPrimary</item>
    </style>
</resources>
`,

    'app/proguard-rules.pro':
`-keep class com.google.androidbrowserhelper.** { *; }
-keep class androidx.** { *; }
-dontwarn com.google.androidbrowserhelper.**
`,

    '.gitignore':
`*.iml
.gradle
/local.properties
/.idea
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
local.properties
`,
  }
}

// ─────────────────────────────────────────────────────────────
// DEFAULT APP CONFIG
// ─────────────────────────────────────────────────────────────
export function defaultAppConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    appName:     'My App',
    packageName: 'com.example.myapp',
    versionName: '1.0.0',
    versionCode: 1,
    minSdk:      21,
    targetSdk:   34,
    compileSdk:  34,
    orientation: 'sensor',
    theme:       'default',
    permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    displayMode: 'standalone',
    enableZoom:  false,
    ...overrides,
  }
}
