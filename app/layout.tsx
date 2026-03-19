import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/layout/Navbar'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { LayoutTransition } from '@/components/layout/LayoutTransition'
import { PullToRefresh } from '@/components/layout/PullToRefresh'
import { ServiceWorkerRegistration } from '@/components/layout/ServiceWorkerRegistration'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Watch Dat — Film Diary for Cinephiles',
    template: '%s | Watch Dat',
  },
  description: 'Track films you\'ve watched, rate and review them, build curated lists, and discover movies through friends.',
  keywords: ['movies', 'film diary', 'letterboxd', 'cinema', 'reviews', 'watchlist'],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Watch Dat',
    description: 'Your digital film diary',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Watch Dat' }],
  },
  twitter: {
    card: 'summary',
    title: 'Watch Dat',
    description: 'Track films you\'ve watched, rate and review them, build curated lists, and discover movies through friends.',
    images: ['/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Watch Dat',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#10b981',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
        <SessionProvider>
          <QueryProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 pt-6 pb-24 md:pb-8">
              <PullToRefresh>
                <LayoutTransition>{children}</LayoutTransition>
              </PullToRefresh>
            </main>
            <BottomTabBar />
            <Toaster />
            <ServiceWorkerRegistration />
            <Analytics />
            <SpeedInsights />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
