import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/layout/Navbar'
import { LayoutTransition } from '@/components/layout/LayoutTransition'

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Watch Dat — Film Diary for Cinephiles',
    template: '%s | Watch Dat',
  },
  description: 'Track films you\'ve watched, rate and review them, build curated lists, and discover movies through friends.',
  keywords: ['movies', 'film diary', 'letterboxd', 'cinema', 'reviews', 'watchlist'],
  openGraph: {
    title: 'Watch Dat',
    description: 'Your digital film diary',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
        <SessionProvider>
          <QueryProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-6">
              <LayoutTransition>{children}</LayoutTransition>
            </main>
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
