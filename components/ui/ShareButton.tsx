'use client'

import { Share2, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  url: string
  title: string
  text?: string
  className?: string
  size?: 'sm' | 'md'
}

export function ShareButton({ url, title, text, className, size = 'sm' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url

    // Use native share sheet if available (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url: fullUrl })
        return
      } catch (err) {
        // User cancelled or share failed — fall through to clipboard
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast({ title: 'Link copied!', description: 'Share it anywhere you like.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Could not copy link', variant: 'destructive' })
    }
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'

  return (
    <button
      onClick={handleShare}
      title="Share"
      aria-label="Share"
      className={cn(
        'flex items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-colors hover:text-foreground hover:border-cinema-500/50',
        btnSize,
        className
      )}
    >
      {copied ? (
        <Check className={cn(iconSize, 'text-cinema-400')} />
      ) : (
        <Share2 className={iconSize} />
      )}
    </button>
  )
}
