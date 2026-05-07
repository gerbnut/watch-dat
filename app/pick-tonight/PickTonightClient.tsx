'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Eye, Heart, Check, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { LogFilmModal } from '@/components/reviews/LogFilmModal'
import { hapticImpact } from '@/lib/native'
import { cn } from '@/lib/utils'

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

// ── Mood chips ───────────────────────────────────────────────────────────────
const MOOD_CHIPS = [
  { label: 'Any',      genreId: null  },
  { label: 'Action',   genreId: 28    },
  { label: 'Comedy',   genreId: 35    },
  { label: 'Drama',    genreId: 18    },
  { label: 'Horror',   genreId: 27    },
  { label: 'Romance',  genreId: 10749 },
  { label: 'Sci-Fi',   genreId: 878   },
  { label: 'Thriller', genreId: 53    },
  { label: 'Fantasy',  genreId: 14    },
] as const

type MoodChip = (typeof MOOD_CHIPS)[number]

// ── SwipeCard sub-component ──────────────────────────────────────────────────
interface SwipeCardProps {
  movie: PickMovie
  isTop: boolean
  stackOffset: number
  selectedGenreId: number | null
  onSwipe: (dir: 'left' | 'right') => void
  onTap: (tmdbId: number) => void
}

function SwipeCard({ movie, isTop, stackOffset, selectedGenreId, onSwipe, onTap }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])
  const watchBadge = useTransform(x, [0, 40, 120], [0, 0, 1])
  const skipBadge = useTransform(x, [-120, -40, 0], [1, 0, 0])
  const didDragRef = useRef(false)

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
        <MoviePoster poster={movie.poster} title={movie.title} tmdbSize="w342" sizes="(max-width: 640px) 100vw, 400px" />
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
      <MoviePoster poster={movie.poster} title={movie.title} tmdbSize="w342" sizes="(max-width: 640px) 100vw, 400px" priority />

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

        {/* Genre chips (max 3) — selected genre first + highlighted */}
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...movie.genres]
              .sort((a, b) => {
                if (a.id === selectedGenreId) return -1
                if (b.id === selectedGenreId) return 1
                return 0
              })
              .slice(0, 3)
              .map((g) => (
              <span
                key={g.id}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm",
                  g.id === selectedGenreId
                    ? "bg-cinema-500/30 text-cinema-300"
                    : "bg-white/20 text-white/80"
                )}
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

// ── Main component ───────────────────────────────────────────────────────────
interface PickTonightClientProps {
  currentUserId: string | null
  genreBackdrops: Record<number, string | null>
}

export function PickTonightClient({ currentUserId, genreBackdrops }: PickTonightClientProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<'mood' | 'swipe' | 'done'>('mood')
  const [selectedMood, setSelectedMood] = useState<MoodChip>(MOOD_CHIPS[0])
  const [cards, setCards] = useState<PickMovie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedCards, setLikedCards] = useState<PickMovie[]>([])
  const [lastSwiped, setLastSwiped] = useState<PickMovie | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentMoodRef = useRef<MoodChip>(MOOD_CHIPS[0])
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

    hapticImpact('light')
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
        })
          .then((res) => {
            if (!res.ok) throw new Error()
            toast({ title: 'Added to watchlist!', variant: 'success' })
          })
          .catch(() => {
            setLikedCards((prev) => prev.filter((c) => c.tmdbId !== card.tmdbId))
            toast({ title: 'Failed to add to watchlist', variant: 'destructive' })
          })
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

  function handleSeenIt() {
    setLogModalOpen(true)
  }

  function handleLogSuccess() {
    setLogModalOpen(false)
    // Advance past this card like a skip
    const newIndex = currentIndexRef.current + 1
    currentIndexRef.current = newIndex
    setCurrentIndex(newIndex)
    const remaining = cardsRef.current.length - newIndex
    if (remaining <= 0 && !nextPageRef.current) {
      setPhase('done')
    }
  }

  // Current movie for LogFilmModal
  const currentCard = cards[currentIndex] ?? null
  const logModalMovie = currentCard
    ? { id: currentCard.tmdbId, title: currentCard.title, poster_path: currentCard.poster, release_date: currentCard.releaseDate ?? '' }
    : null

  // Visible stack: up to 3 cards starting from currentIndex
  const visibleCards = cards.slice(currentIndex, currentIndex + 3)

  // ── Mood phase ───────────────────────────────────────────────────────────
  if (phase === 'mood') {
    return (
      <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/films')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Back to films"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight">Pick Tonight</h1>
            <p className="text-muted-foreground text-sm">What are you in the mood for?</p>
          </div>

          {/* Genre grid — backdrop image cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {MOOD_CHIPS.map((chip) => {
              const isSelected = selectedMood.label === chip.label
              const backdrop = chip.genreId ? genreBackdrops[chip.genreId] : null
              return (
                <button
                  key={chip.label}
                  onClick={() => setSelectedMood(chip)}
                  className={cn(
                    'relative h-[80px] rounded-xl overflow-hidden transition-all focus:outline-none touch-manipulation active:scale-[0.97]',
                    isSelected
                      ? 'ring-2 ring-cinema-400 shadow-[0_0_12px_-3px_rgba(16,185,129,0.4)]'
                      : 'ring-1 ring-white/[0.08] hover:ring-white/[0.16]'
                  )}
                >
                  {/* Backdrop image or gradient for "Any" */}
                  {backdrop ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.tmdb.org/t/p/w780${backdrop}`}
                      alt={chip.label}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-cinema-900/60 to-cinema-950/80" />
                  )}

                  {/* Gradient overlay */}
                  <div className={cn(
                    'absolute inset-0 transition-colors duration-200',
                    isSelected
                      ? 'bg-cinema-900/70'
                      : 'bg-gradient-to-t from-black/80 via-black/40 to-black/20'
                  )} />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center gap-0.5">
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="h-5 w-5 rounded-full bg-cinema-400 flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-black" />
                      </motion.div>
                    )}
                    {!chip.genreId && !isSelected && (
                      <Film className="h-4 w-4 text-white/60 mb-0.5" />
                    )}
                    <span className={cn(
                      'text-xs font-semibold tracking-wide',
                      isSelected ? 'text-cinema-300' : 'text-white'
                    )}>
                      {chip.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <Button
            variant="cinema"
            className="w-full font-bold shadow-glow-green-sm"
            size="lg"
            onClick={handleStart}
          >
            Start Swiping
          </Button>
        </div>
      </div>
    )
  }

  // ── Done phase ───────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center px-4 py-8">
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
              {likedCards.map((m) => (
                  <Link key={m.tmdbId} href={`/film/${m.tmdbId}`} className="shrink-0">
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-muted relative">
                      <MoviePoster poster={m.poster} title={m.title} tmdbSize="w185" sizes="80px" />
                    </div>
                  </Link>
                ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="glass" className="flex-1" onClick={handleChangeMood}>
              Change mood
            </Button>
            <Button
              variant="cinema"
              className="flex-1 font-bold shadow-glow-green-sm"
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
    <div className="min-h-[calc(100dvh-6rem)] flex flex-col items-center justify-center px-4 py-6 gap-6">
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between text-sm">
        <button
          onClick={handleChangeMood}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors touch-manipulation"
          aria-label="Change mood"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="font-bold text-foreground">
          {selectedMood.label}
        </span>
        <span className="flex items-center gap-1 text-cinema-400 font-medium">
          <Heart className="h-3.5 w-3.5 fill-cinema-400" />
          {likedCards.length}
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
                  selectedGenreId={currentMoodRef.current.genreId}
                  onSwipe={handleSwipe}
                  onTap={handleTap}
                />
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Action buttons with labels */}
      <div className="flex items-end gap-6">
        {/* Skip */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleSwipe('left')}
            disabled={loading || visibleCards.length === 0}
            className="h-14 w-14 rounded-full border-2 border-destructive/60 text-destructive flex items-center justify-center text-2xl hover:bg-destructive/10 hover:border-destructive active:scale-[0.93] transition-all disabled:opacity-40 touch-manipulation"
            aria-label="Skip"
          >
            ✕
          </button>
          <span className="text-[10px] text-muted-foreground/50">Skip</span>
        </div>

        {/* Seen it */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSeenIt}
            disabled={loading || visibleCards.length === 0 || !currentUserId}
            className="h-10 w-10 rounded-full border border-white/[0.15] text-muted-foreground flex items-center justify-center hover:bg-white/[0.05] hover:text-foreground active:scale-[0.93] transition-all disabled:opacity-40 touch-manipulation"
            aria-label="Seen it"
          >
            <Eye className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-muted-foreground/50">Seen it</span>
        </div>

        {/* Undo */}
        <AnimatePresence>
          {showUndo && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <button
                onClick={handleUndo}
                className="h-10 w-10 rounded-full border border-white/[0.06] text-muted-foreground flex items-center justify-center text-base hover:bg-white/[0.05] active:scale-[0.93] transition-all touch-manipulation"
                aria-label="Undo"
              >
                ↩
              </button>
              <span className="text-[10px] text-muted-foreground/50">Undo</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watchlist */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleSwipe('right')}
            disabled={loading || visibleCards.length === 0}
            className="h-14 w-14 rounded-full border-2 border-cinema-400/60 text-cinema-400 flex items-center justify-center hover:bg-cinema-400/10 hover:border-cinema-400 hover:shadow-glow-green-xs active:scale-[0.93] transition-all disabled:opacity-40 touch-manipulation"
            aria-label="Add to watchlist"
          >
            <Heart className="h-6 w-6" />
          </button>
          <span className="text-[10px] text-muted-foreground/50">Watchlist</span>
        </div>
      </div>

      {/* Hint */}
      <p className="text-muted-foreground/40 text-xs text-center">
        Swipe right to add to watchlist, left to skip
      </p>

      {/* Log Film Modal for "Seen it" */}
      {logModalMovie && (
        <LogFilmModal
          open={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          preselectedMovie={logModalMovie}
          onSuccess={handleLogSuccess}
        />
      )}
    </div>
  )
}
