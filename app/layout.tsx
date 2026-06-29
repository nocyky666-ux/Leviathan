import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Leviathan — Build Android Apps From The Browser',
    template: '%s · Leviathan',
  },
  description: 'Convert websites, PWAs, GitHub repos, and source code into Android APKs entirely from your browser. No login, no registration, no limits.',
  keywords: ['Android', 'APK builder', 'PWA to APK', 'website to APK', 'GitHub Actions', 'TWA'],
  authors: [{ name: 'Dev Noctky' }],
  creator: 'Dev Noctky',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://leviathan.vercel.app'),
  openGraph: {
    title: 'Leviathan — Build Android Apps From The Browser',
    description: 'Convert websites, PWAs, GitHub repos, and source code into Android APKs.',
    type: 'website',
    siteName: 'Leviathan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leviathan — Build Android Apps From The Browser',
    description: 'Convert websites, PWAs, GitHub repos, and source code into Android APKs.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)',  color: '#09090B' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
