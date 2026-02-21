'use client'

import { useEffect } from 'react'

// global-error replaces the root layout on crash, so it must include <html>/<body>
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold">Watch Dat hit a snag</h1>
          <p className="text-sm text-muted-foreground">
            A critical error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="rounded-md bg-cinema-500 text-black px-4 py-2 text-sm font-semibold hover:bg-cinema-400 transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
