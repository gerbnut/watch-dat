'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
    <Button variant="outline" size="sm" onClick={toggle} disabled={loading} className="overflow-hidden min-w-[110px]">
      <AnimatePresence mode="wait" initial={false}>
        {isOnWatchlist ? (
          <motion.span
            key="on-watchlist"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1.5"
          >
            <motion.span animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 0.3, times: [0, 0.5, 1] }}>
              <BookmarkCheck className="h-4 w-4 text-cinema-400" />
            </motion.span>
            On watchlist
          </motion.span>
        ) : (
          <motion.span
            key="watchlist"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1.5"
          >
            <Bookmark className="h-4 w-4" /> Watchlist
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  )
}
