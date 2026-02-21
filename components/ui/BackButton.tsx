'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackButton({ className }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  )
}
