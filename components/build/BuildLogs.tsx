'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Maximize2, Copy, Check } from 'lucide-react'
import type { BuildStatus } from '@/types'

interface BuildLogsProps {
  buildId: string
  status: BuildStatus
  initialLogs?: string
}

const FAKE_LOG_LINES = [
  '[leviathan] Preparing build environment...',
  '[leviathan] Cloning repository...',
  '[leviathan] Setting up JDK 17...',
  '[leviathan] Configuring Android SDK...',
  '[leviathan] Running Gradle build...',
  '[gradle] > Task :app:preBuild',
  '[gradle] > Task :app:preDebugBuild',
  '[gradle] > Task :app:compileDebugAidl',
  '[gradle] > Task :app:compileDebugRenderscript',
  '[gradle] > Task :app:generateDebugBuildConfig',
  '[gradle] > Task :app:javaPreCompileDebug',
  '[gradle] > Task :app:mergeDebugJniLibFolders',
  '[gradle] > Task :app:mergeDebugNativeLibs',
  '[gradle] > Task :app:processDebugManifest',
  '[gradle] > Task :app:processDebugResources',
  '[gradle] > Task :app:compileDebugJavaWithJavac',
  '[gradle] > Task :app:dexBuilderDebug',
  '[gradle] > Task :app:mergeProjectDexDebug',
  '[gradle] > Task :app:packageDebug',
  '[gradle] BUILD SUCCESSFUL in 1m 42s',
  '[leviathan] Uploading artifact...',
  '[leviathan] Build complete ✓',
]

export function BuildLogs({ buildId, status, initialLogs }: BuildLogsProps) {
  const [lines, setLines] = useState<string[]>(initialLogs ? initialLogs.split('\n') : [])
  const [copied, setCopied] = useState(false)
  const [lineIndex, setLineIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Simulate live streaming when running
  useEffect(() => {
    if (status !== 'running' || initialLogs) return
    if (lineIndex >= FAKE_LOG_LINES.length) return

    const timer = setTimeout(() => {
      setLines(prev => [...prev, FAKE_LOG_LINES[lineIndex]])
      setLineIndex(i => i + 1)
    }, 600 + Math.random() * 800)

    return () => clearTimeout(timer)
  }, [status, lineIndex, initialLogs])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const copyLogs = async () => {
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colorLine = (line: string): string => {
    if (line.includes('BUILD SUCCESSFUL') || line.includes('complete ✓') || line.includes('SUCCESS')) return 'log-success'
    if (line.includes('ERROR') || line.includes('FAILED') || line.includes('error:')) return 'log-error'
    if (line.includes('WARNING') || line.includes('warn:')) return 'log-warn'
    if (line.startsWith('[leviathan]')) return 'log-info'
    if (line.startsWith('[gradle] >')) return 'log-dim'
    return ''
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Terminal size={13} />
          <span>Build Logs</span>
          {status === 'running' && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              <span className="text-[var(--primary)]">Live</span>
            </span>
          )}
        </div>
        <button
          onClick={copyLogs}
          className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Terminal */}
      <div
        ref={containerRef}
        className="terminal h-64 lg:h-80 overflow-y-auto"
      >
        {lines.length === 0 ? (
          <p className="text-[var(--text-subtle)] text-xs">Waiting for build to start...</p>
        ) : (
          lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`${colorLine(line)} leading-relaxed`}
            >
              <span className="text-[var(--text-subtle)] select-none mr-2">
                {String(i + 1).padStart(3, ' ')}
              </span>
              {line || ' '}
            </motion.div>
          ))
        )}

        {/* Blinking cursor when running */}
        {status === 'running' && (
          <span className="inline-block w-2 h-3.5 bg-[var(--primary)] animate-pulse ml-8" />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
