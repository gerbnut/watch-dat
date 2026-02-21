'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

interface WatchlistButtonClientProps {
  tmdbId: number
  isOnWatchlist: boolean
}

export function WatchlistButtonClient({ tmdbId, isOnWatchlist: initial }: WatchlistButtonClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOnWatchlist, setIsOnWatchlist] = useState(initial)
  const [loading, setLoading] = useState(false)

  if (!session?.user) return null

  async function toggle() {
    setLoading(true)
    const prev = isOnWatchlist
    setIsOnWatchlist(!isOnWatchlist) // optimistic
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId }),
      })
      const data = await res.json()
      setIsOnWatchlist(data.added)
      toast({ title: data.added ? 'Added to watchlist' : 'Removed from watchlist', variant: 'success' })
      router.refresh()
    } catch {
      setIsOnWatchlist(prev)
      toast({ title: 'Error', description: 'Failed to update watchlist', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading}>
      {isOnWatchlist ? (
        <><BookmarkCheck className="h-4 w-4 text-cinema-400" /> On watchlist</>
      ) : (
        <><Bookmark className="h-4 w-4" /> Watchlist</>
      )}
    </Button>
  )
}
