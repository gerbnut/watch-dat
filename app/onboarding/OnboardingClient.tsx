'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Shuffle, Upload, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MovieSearch } from '@/components/movies/MovieSearch'
import { MoviePoster } from '@/components/movies/MoviePoster'
import { LetterboxdImportModal } from '@/components/import/LetterboxdImportModal'
import { cn } from '@/lib/utils'

interface SuggestedMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
}

interface SelectedMovie {
  tmdbId: number
  title: string
  poster: string | null
}

interface Props {
  suggestions: SuggestedMovie[]
  username: string
  displayName: string
}

const TOTAL_STEPS = 3

const GENRE_CHIPS = [
  { id: 28, name: 'Action', emoji: '💥' },
  { id: 35, name: 'Comedy', emoji: '😂' },
  { id: 18, name: 'Drama', emoji: '🎭' },
  { id: 27, name: 'Horror', emoji: '👻' },
  { id: 10749, name: 'Romance', emoji: '💕' },
  { id: 878, name: 'Sci-Fi', emoji: '🚀' },
  { id: 53, name: 'Thriller', emoji: '🔪' },
  { id: 14, name: 'Fantasy', emoji: '🧙' },
  { id: 99, name: 'Documentary', emoji: '📽️' },
  { id: 16, name: 'Animation', emoji: '🎨' },
  { id: 80, name: 'Crime', emoji: '🔍' },
  { id: 9648, name: 'Mystery', emoji: '🕵️' },
] as const

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function OnboardingClient({ suggestions, username, displayName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [selected, setSelected] = useState<SelectedMovie[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importDone, setImportDone] = useState(false)

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  function toggle(movie: SuggestedMovie) {
    setSelected((prev) => {
      const exists = prev.find((m) => m.tmdbId === movie.id)
      if (exists) return prev.filter((m) => m.tmdbId !== movie.id)
      if (prev.length >= 5) return prev
      return [...prev, { tmdbId: movie.id, title: movie.title, poster: movie.poster_path }]
    })
  }

  function toggleGenre(genreId: number) {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    )
  }

  function handleSearchSelect(movie: { id: number; title: string; poster_path: string | null }) {
    setSelected((prev) => {
      if (prev.find((m) => m.tmdbId === movie.id)) return prev
      if (prev.length >= 5) return prev
      return [...prev, { tmdbId: movie.id, title: movie.title, poster: movie.poster_path }]
    })
  }

  async function handleFinish(skip = false) {
    setSaving(true)
    try {
      const promises: Promise<any>[] = []
      if (!skip && selected.length > 0) {
        promises.push(
          fetch(`/api/users/${username}/favorites`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tmdbIds: selected.map((m) => m.tmdbId) }),
          })
        )
      }
      if (selectedGenres.length > 0) {
        promises.push(
          fetch('/api/me/genre-preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ genreIds: selectedGenres }),
          })
        )
      }
      await Promise.all(promises)
      await fetch('/api/auth/complete-onboarding', { method: 'POST' })
    } catch {
      const { toast } = await import('@/hooks/use-toast')
      toast({ title: 'Could not save preferences', variant: 'destructive' })
      return
    } finally {
      setSaving(false)
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Step indicator dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              s === step ? 'w-6 bg-cinema-400' : 'w-2 bg-white/[0.15]'
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 ? (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">
                Welcome, {displayName}!
              </p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                Import from Letterboxd
              </h1>
              <p className="text-sm text-muted-foreground">
                Already have a Letterboxd account? Import your diary and watchlist to get started
                instantly.
              </p>
            </div>

            {/* Import card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 text-center space-y-4">
              {importDone ? (
                <>
                  <div className="h-12 w-12 mx-auto rounded-full bg-cinema-500/10 flex items-center justify-center">
                    <Check className="h-6 w-6 text-cinema-400" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-medium">Import complete</p>
                    <p className="text-sm text-muted-foreground">
                      Your Letterboxd data has been imported
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground/20" />
                  <div className="space-y-1.5">
                    <p className="font-medium">Bring your data with you</p>
                    <p className="text-sm text-muted-foreground">
                      Export your data from Letterboxd, then upload it here
                    </p>
                  </div>
                  <Button
                    variant="cinema"
                    size="sm"
                    onClick={() => setShowImportModal(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import from Letterboxd
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ) : step === 2 ? (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">
                Step 2 of 3
              </p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                Pick your favourite films
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose up to 5 films that defined your taste. They'll appear on your profile.
              </p>
            </div>

            {/* Search */}
            <MovieSearch
              placeholder="Search for any film..."
              navigateOnSelect={false}
              onSelect={handleSearchSelect}
            />

            {/* Selected strip */}
            {selected.length > 0 && (
              <div className="flex gap-2 items-center flex-wrap">
                {selected.map((film) => (
                  <button
                    key={film.tmdbId}
                    onClick={() =>
                      setSelected((prev) => prev.filter((m) => m.tmdbId !== film.tmdbId))
                    }
                    className="relative group shrink-0"
                    title={`Remove ${film.title}`}
                  >
                    <div className="relative w-12 h-[72px] sm:w-14 sm:h-[84px] rounded-md overflow-hidden shadow-md ring-2 ring-cinema-500">
                      <MoviePoster
                        poster={film.poster}
                        title={film.title}
                        tmdbSize="w185"
                        sizes="56px"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">Remove</span>
                      </div>
                    </div>
                  </button>
                ))}
                <span className="text-xs text-muted-foreground">{selected.length}/5</span>
              </div>
            )}

            {/* Suggestions grid */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
                <Shuffle className="h-3.5 w-3.5" /> Popular right now
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {suggestions.map((movie) => {
                  const isSelected = selected.some((m) => m.tmdbId === movie.id)
                  const isDisabled = !isSelected && selected.length >= 5
                  return (
                    <button
                      key={movie.id}
                      onClick={() => toggle(movie)}
                      disabled={isDisabled}
                      className={cn(
                        'relative rounded-md overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cinema-500 touch-manipulation',
                        isDisabled
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:scale-105 active:scale-95'
                      )}
                      title={movie.title}
                    >
                      <div className="relative w-full aspect-[2/3] bg-muted">
                        <MoviePoster
                          poster={movie.poster_path}
                          title={movie.title}
                          tmdbSize="w185"
                          sizes="(max-width: 640px) 25vw, (max-width: 768px) 16.6vw, 12.5vw"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-cinema-500/70 flex items-center justify-center">
                            <Check className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">
                Step 3 of 3
              </p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                What genres do you love?
              </h1>
              <p className="text-sm text-muted-foreground">
                Pick your favourites — we'll use these to personalise your recommendations.
              </p>
            </div>

            {/* Genre grid */}
            <div className="grid grid-cols-3 gap-2">
              {GENRE_CHIPS.map((genre) => {
                const isSelected = selectedGenres.includes(genre.id)
                return (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-cinema-500/40 bg-cinema-500/15 text-foreground shadow-glow-green-xs'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-cinema-500/30 hover:bg-white/[0.04] hover:text-foreground',
                    )}
                  >
                    <span className="text-2xl">{genre.emoji}</span>
                    <span>{genre.name}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions — z-[60] so it sits above the BottomTabBar (z-50) */}
      <div
        className="fixed bottom-0 inset-x-0 z-[60] border-t border-border/60 bg-background/95 backdrop-blur-sm p-4 flex items-center gap-3"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {step === 1 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(2)}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <div className="flex-1" />
            <Button
              variant="cinema"
              size="sm"
              onClick={() => goToStep(2)}
              className="min-w-[120px] gap-2"
            >
              {importDone ? 'Next' : 'Skip'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(3)}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">{selected.length}/5 selected</span>
            <Button
              variant="cinema"
              size="sm"
              onClick={() => goToStep(3)}
              className="min-w-[120px] gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFinish(selectedGenres.length === 0 && selected.length === 0)}
              disabled={saving}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <div className="flex-1" />
            {selectedGenres.length > 0 && (
              <span className="text-xs text-muted-foreground">{selectedGenres.length} selected</span>
            )}
            <Button
              variant="cinema"
              size="sm"
              onClick={() => handleFinish(false)}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Get started →'
              )}
            </Button>
          </>
        )}
      </div>

      {/* Letterboxd Import Modal */}
      <LetterboxdImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => setImportDone(true)}
      />
    </div>
  )
}
