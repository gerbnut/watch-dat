'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react'

export default function FilmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    console.error('[FilmsError]', error)
  }, [error])

  const handleRetry = () => {
    setRetrying(true)
    router.refresh()
    setTimeout(() => {
      reset()
      setRetrying(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Could not load films. Please try again.
        </p>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground/50 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRetry}
        disabled={retrying}
        className="gap-2"
      >
        {retrying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" />
        )}
        {retrying ? 'Retrying...' : 'Try again'}
      </Button>
    </div>
  )
}
