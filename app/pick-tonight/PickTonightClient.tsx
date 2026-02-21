'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ── Inline TMDB image helper (no lib/tmdb import — avoids Prisma bundling) ──
const TMDB_BASE = 'https://image.tmdb.org/t/p'
function tmdbPoster(path: string | null, size = 'w500') {
  return path ? `${TMDB_BASE}/${size}${path}` : null
}

// ── Types ────────────────────────────────────────────────────────────────────
interface PickMovie {
  tmdbId: number
  title: string
  poster: string | null
  backdrop: string | null
  overview: string
  releaseDate: string | null
  genres: { id: number; name: string }[]
  voteAverage: number
  friendRecs: { username: string; avatar: string | null; rating: number }[]
}

// ── Mood chips (hardcoded — no GENRE_MAP import) ─────────────────────────────
const MOOD_CHIPS = [
  { label: 'Any',      emoji: '🎬', genreId: null  },
  { label: 'Action',   emoji: '💥', genreId: 28    },
  { label: 'Comedy',   emoji: '😂', genreId: 35    },
  { label: 'Drama',    emoji: '🎭', genreId: 18    },
  { label: 'Horror',   emoji: '👻', genreId: 27    },
  { label: 'Romance',  emoji: '💕', genreId: 10749 },
  { label: 'Sci-Fi',   emoji: '🚀', genreId: 878   },
  { label: 'Thriller', emoji: '🔪', genreId: 53    },
  { label: 'Fantasy',  emoji: '🧙', genreId: 14    },
] as const

type MoodChip = (typeof MOOD_CHIPS)[number]

// ── SwipeCard sub-component ──────────────────────────────────────────────────
interface SwipeCardProps {
  movie: PickMovie
  isTop: boolean
  stackOffset: number
  onSwipe: (dir: 'left' | 'right') => void
  onTap: (tmdbId: number) => void
}

function SwipeCard({ movie, isTop, stackOffset, onSwipe, onTap }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const watchBadge = useTransform(x, [0, 40, 120], [0, 0, 1])
  const skipBadge = useTransform(x, [-120, -40, 0], [1, 0, 0])
  const didDragRef = useRef(false)

  const posterUrl = tmdbPoster(movie.poster)

  function handleDragStart() {
    didDragRef.current = false
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info
    if (Math.abs(offset.x) > 5) didDragRef.current = true
    setTimeout(() => { didDragRef.current = false }, 50)

    if (offset.x > 80 || velocity.x > 500) {
      onSwipe('right')
    } else if (offset.x < -80 || velocity.x < -500) {
      onSwipe('left')
    }
  }

  function handleClick() {
    if (didDragRef.current) return
    onTap(movie.tmdbId)
  }

  // Non-top cards use static CSS stack offset
  if (!isTop) {
    const scale = stackOffset === 1 ? 0.97 : 0.94
    const translateY = stackOffset === 1 ? 10 : 20
    const zIndex = stackOffset === 1 ? 2 : 1
    return (
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          zIndex,
          willChange: 'transform',
        }}
      >
        {posterUrl ? (
          <Image src={posterUrl} alt={movie.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
      </div>
    )
  }

  return (
    <motion.div
      key={movie.tmdbId}
      className="absolute inset-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, zIndex: 3 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 400 : -400, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Poster */}
      {posterUrl ? (
        <Image src={posterUrl} alt={movie.title} fill className="object-cover" sizes="320px" priority />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-4xl">🎬</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* WATCH badge */}
      <motion.div
        className="absolute top-4 left-4 border-4 border-cinema-400 text-cinema-400 font-black text-xl px-3 py-1 rounded rotate-[-15deg] pointer-events-none"
        style={{ opacity: watchBadge }}
      >
        WATCH
      </motion.div>

      {/* SKIP badge */}
      <motion.div
        className="absolute top-4 right-4 border-4 border-destructive text-destructive font-black text-xl px-3 py-1 rounded rotate-[15deg] pointer-events-none"
        style={{ opacity: skipBadge }}
      >
        SKIP
      </motion.div>

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-4 space-y-1.5">
        {/* Rating */}
        <div className="flex items-center gap-1">
          <span className="text-cinema-400 text-sm font-bold">★</span>
          <span className="text-white text-sm font-medium">{movie.voteAverage.toFixed(1)}</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-xl leading-tight line-clamp-2">{movie.title}</h3>

        {/* Genre chips (max 3) */}
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0, 3).map((g) => (
              <span
                key={g.id}
                className="text-white/80 text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* Overview */}
        {movie.overview && (
          <p className="text-white/70 text-xs line-clamp-2">{movie.overview}</p>
        )}

        {/* Friend recs */}
        {movie.friendRecs.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex -space-x-1.5">
              {movie.friendRecs.slice(0, 3).map((r, i) => (
                <div
                  key={r.username}
                  className="h-5 w-5 rounded-full border border-black/40 overflow-hidden bg-cinema-900 flex items-center justify-center"
                  style={{ zIndex: 10 - i }}
                >
                  {r.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatar} alt={r.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-cinema-300 font-bold">
                      {r.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-white/60 text-[10px]">
              {movie.friendRecs.length === 1
                ? `${movie.friendRecs[0].username} loved this`
                : `${movie.friendRecs.length} friends loved this`}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface PickTonightClientProps {
  currentUserId: string | null
}

export function PickTonightClient({ currentUserId }: PickTonightClientProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<'mood' | 'swipe' | 'done'>('mood')
  const [selectedMood, setSelectedMood] = useState<MoodChip>(MOOD_CHIPS[0])
  const [cards, setCards] = useState<PickMovie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedCards, setLikedCards] = useState<PickMovie[]>([])
  const [lastSwiped, setLastSwiped] = useState<PickMovie | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [loading, setLoading] = useState(false)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentMoodRef = useRef<MoodChip>(MOOD_CHIPS[0])
  // Refs for synchronous access inside swipe handler
  const cardsRef = useRef<PickMovie[]>([])
  const currentIndexRef = useRef(0)
  const nextPageRef = useRef<number | null>(null)
  const isFetchingMoreRef = useRef(false)

  const loadMovies = useCallback(async (
    genreId: number | null,
    page: number,
    isInitial: boolean,
  ) => {
    const params = new URLSearchParams({ page: String(page) })
    if (genreId !== null) params.set('genreId', String(genreId))
    const url = `/api/pick-tonight?${params}`

    try {
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const movies: PickMovie[] = data.movies ?? []
      if (isInitial) {
        cardsRef.current = movies
        currentIndexRef.current = 0
        setCards(movies)
        setCurrentIndex(0)
      } else {
        const updated = [...cardsRef.current, ...movies]
        cardsRef.current = updated
        setCards(updated)
      }
      nextPageRef.current = data.nextPage ?? null
    } catch {
      // silently fail — client handles empty state
    }
  }, [])

  async function handleStart() {
    const mood = selectedMood
    currentMoodRef.current = mood
    cardsRef.current = []
    currentIndexRef.current = 0
    nextPageRef.current = null
    isFetchingMoreRef.current = false
    setCards([])
    setCurrentIndex(0)
    setLikedCards([])
    setLastSwiped(null)
    setShowUndo(false)
    setPhase('swipe')
    setLoading(true)
    await loadMovies(mood.genreId, 1, true)
    setLoading(false)
  }

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const card = cardsRef.current[currentIndexRef.current]
    if (!card) return

    setLastSwiped(card)
    setShowUndo(true)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => setShowUndo(false), 3000)

    if (direction === 'right') {
      setLikedCards((prev) => [...prev, card])
      if (currentUserId) {
        fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbId: card.tmdbId }),
        }).catch(() => {})
        toast({ title: 'Added to watchlist!', variant: 'success' })
      }
    }

    const newIndex = currentIndexRef.current + 1
    currentIndexRef.current = newIndex
    setCurrentIndex(newIndex)

    const remaining = cardsRef.current.length - newIndex
    if (remaining <= 0 && !nextPageRef.current) {
      setPhase('done')
    } else if (remaining <= 5 && nextPageRef.current && !isFetchingMoreRef.current) {
      isFetchingMoreRef.current = true
      loadMovies(currentMoodRef.current.genreId, nextPageRef.current, false).finally(() => {
        isFetchingMoreRef.current = false
      })
    }
  }, [currentUserId, loadMovies])

  function handleUndo() {
    if (!lastSwiped) return
    const newIndex = Math.max(0, currentIndexRef.current - 1)
    currentIndexRef.current = newIndex
    setCurrentIndex(newIndex)
    setLikedCards((prev) => prev.filter((c) => c.tmdbId !== lastSwiped.tmdbId))
    setLastSwiped(null)
    setShowUndo(false)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }

  function handleTap(tmdbId: number) {
    router.push(`/film/${tmdbId}`)
  }

  function handleChangeMood() {
    setPhase('mood')
  }

  // Visible stack: up to 3 cards starting from currentIndex
  const visibleCards = cards.slice(currentIndex, currentIndex + 3)

  // ── Mood phase ───────────────────────────────────────────────────────────
  if (phase === 'mood') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Pick Tonight</h1>
            <p className="text-muted-foreground text-sm">What are you in the mood for?</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MOOD_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => setSelectedMood(chip)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-sm font-medium transition-all',
                  selectedMood.label === chip.label
                    ? 'border-cinema-500 bg-cinema-500/20 text-foreground'
                    : 'border-border text-muted-foreground hover:border-cinema-500/50 hover:text-foreground',
                )}
              >
                <span className="text-2xl">{chip.emoji}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          <Button
            className="w-full bg-cinema-500 text-black font-bold hover:bg-cinema-400"
            size="lg"
            onClick={handleStart}
          >
            Start Swiping →
          </Button>
        </div>
      </div>
    )
  }

  // ── Done phase ───────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-black">
              {likedCards.length > 0
                ? `${likedCards.length} film${likedCards.length === 1 ? '' : 's'} added to watchlist`
                : "Nothing caught your eye?"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {likedCards.length > 0 ? "Great picks!" : "Try a different mood"}
            </p>
          </div>

          {likedCards.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {likedCards.map((m) => {
                const url = tmdbPoster(m.poster, 'w185')
                return (
                  <Link key={m.tmdbId} href={`/film/${m.tmdbId}`} className="shrink-0">
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-muted relative">
                      {url ? (
                        <Image src={url} alt={m.title} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-2xl">
                          🎬
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleChangeMood}>
              Change mood
            </Button>
            <Button
              className="flex-1 bg-cinema-500 text-black font-bold hover:bg-cinema-400"
              onClick={handleStart}
            >
              Start over
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Swipe phase ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 gap-6">
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between text-sm">
        <button
          onClick={handleChangeMood}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Change mood
        </button>
        <span className="font-semibold">
          {selectedMood.emoji} {selectedMood.label}
        </span>
        <span className="text-muted-foreground">
          {likedCards.length} liked
        </span>
      </div>

      {/* Card stack */}
      <div className="relative w-[320px] h-[480px] mx-auto">
        {loading ? (
          <div className="absolute inset-0 rounded-2xl bg-muted animate-pulse" />
        ) : visibleCards.length === 0 ? (
          <div className="absolute inset-0 rounded-2xl bg-muted flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No more films</p>
          </div>
        ) : (
          <AnimatePresence>
            {[...visibleCards].reverse().map((movie, reversedIndex) => {
              const stackOffset = visibleCards.length - 1 - reversedIndex
              const isTop = stackOffset === 0
              return (
                <SwipeCard
                  key={movie.tmdbId}
                  movie={movie}
                  isTop={isTop}
                  stackOffset={stackOffset}
                  onSwipe={handleSwipe}
                  onTap={handleTap}
                />
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        {/* Skip */}
        <button
          onClick={() => handleSwipe('left')}
          disabled={loading || visibleCards.length === 0}
          className="h-14 w-14 rounded-full border-2 border-destructive text-destructive flex items-center justify-center text-2xl hover:bg-destructive/10 transition-colors disabled:opacity-40"
          aria-label="Skip"
        >
          ✕
        </button>

        {/* Undo */}
        <AnimatePresence>
          {showUndo && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleUndo}
              className="h-10 w-10 rounded-full border border-border text-muted-foreground flex items-center justify-center text-base hover:bg-accent transition-colors"
              aria-label="Undo"
            >
              ↩
            </motion.button>
          )}
        </AnimatePresence>

        {/* Like / Watch */}
        <button
          onClick={() => handleSwipe('right')}
          disabled={loading || visibleCards.length === 0}
          className="h-14 w-14 rounded-full border-2 border-cinema-400 text-cinema-400 flex items-center justify-center text-2xl hover:bg-cinema-400/10 transition-colors disabled:opacity-40"
          aria-label="Add to watchlist"
        >
          ♥
        </button>
      </div>

      {/* Hint */}
      <p className="text-muted-foreground text-xs">Tap to view details · Swipe or tap buttons</p>
    </div>
  )
}
