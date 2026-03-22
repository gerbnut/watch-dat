'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ArrowDownAZ, CalendarArrowDown, CalendarArrowUp, Clock } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'added', label: 'Recently Added', icon: Clock },
  { value: 'title', label: 'Title A–Z', icon: ArrowDownAZ },
  { value: 'newest', label: 'Newest First', icon: CalendarArrowDown },
  { value: 'oldest', label: 'Oldest First', icon: CalendarArrowUp },
] as const

interface WatchlistControlsProps {
  genres: string[]
  currentSort: string
  currentGenre: string | null
}

export function WatchlistControls({ genres, currentSort, currentGenre }: WatchlistControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParams(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'added') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const qs = params.toString()
    router.push(qs ? `/watchlist?${qs}` : '/watchlist', { scroll: false })
  }

  return (
    <div className="space-y-3">
      {/* Sort */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => updateParams('sort', value)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
              currentSort === value
                ? 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-transparent'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Genre filter */}
      {genres.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          <button
            onClick={() => updateParams('genre', null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border',
              !currentGenre
                ? 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-transparent'
            )}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => updateParams('genre', currentGenre === genre ? null : genre)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                currentGenre === genre
                  ? 'bg-cinema-500/10 text-cinema-400 border-cinema-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border-transparent'
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
