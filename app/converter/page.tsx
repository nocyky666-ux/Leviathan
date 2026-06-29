import type { Metadata } from 'next'
import { AppLayout } from '@/components/layout/AppLayout'
import { UniversalConverter } from '@/components/converter/UniversalConverter'

export const metadata: Metadata = {
  title: 'Universal Converter',
  description: 'Convert websites, PWAs, GitHub repos, and ZIP files into Android APKs.',
}

export default function ConverterPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Universal Converter</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Convert any web project or source code into an Android APK using GitHub Actions.
        </p>
      </div>
      <UniversalConverter />
    </AppLayout>
  )
}
