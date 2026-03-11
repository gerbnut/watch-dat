'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageErrorProps {
  message?: string
  reset: () => void
}

export function PageError({ message, reset }: PageErrorProps) {
  return (
    <div className="rounded-xl border bg-card p-12 text-center space-y-4">
      <AlertTriangle className="h-10 w-10 mx-auto text-destructive/60" />
      <div className="space-y-1.5">
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          {message ?? 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
