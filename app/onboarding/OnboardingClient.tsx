'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Check, Loader2, Shuffle, Upload, ArrowRight, ChevronLeft } from 'lucide-react'
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
  genreBackdrops: Record<number, string | null>
  username: string
  displayName: string
}

const TOTAL_STEPS = 3

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 14, name: 'Fantasy' },
  { id: 99, name: 'Documentary' },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 9648, name: 'Mystery' },
] as const

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
    scale: 0.98,
  }),
}

const slideTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
}

export function OnboardingClient({ suggestions, genreBackdrops, username, displayName }: Props) {
  const router = useRouter()
  const { update } = useSession()
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
      await update()
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
    <div className="flex flex-col min-h-[100dvh] max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-cinema-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content — flex-1 fills available space */}
      <div className="flex-1 px-4 pt-8 pb-40">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 ? (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="space-y-8"
            >
              {/* Header */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">
                  Welcome, {displayName}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Import from Letterboxd
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Already have a Letterboxd account? Import your diary and watchlist to get started instantly.
                </p>
              </div>

              {/* Import card */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center space-y-5">
                {importDone ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="h-14 w-14 mx-auto rounded-full bg-cinema-500/15 flex items-center justify-center"
                    >
                      <Check className="h-7 w-7 text-cinema-400" />
                    </motion.div>
                    <div className="space-y-1.5">
                      <p className="text-lg font-medium">Import complete</p>
                      <p className="text-sm text-muted-foreground">
                        Your Letterboxd data has been imported
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-14 w-14 mx-auto rounded-full bg-white/[0.04] flex items-center justify-center">
                      <Upload className="h-7 w-7 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-lg font-medium">Bring your data with you</p>
                      <p className="text-sm text-muted-foreground">
                        Export your data from Letterboxd, then upload it here
                      </p>
                    </div>
                    <Button
                      variant="cinema"
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
              transition={slideTransition}
              className="space-y-6"
            >
              {/* Header */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">
                  Step 2 of 3
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Pick your favourite films
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
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
                <div className="flex gap-2.5 items-center flex-wrap">
                  {selected.map((film) => (
                    <motion.button
                      key={film.tmdbId}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={() =>
                        setSelected((prev) => prev.filter((m) => m.tmdbId !== film.tmdbId))
                      }
                      className="relative group shrink-0 active:scale-90 transition-transform touch-manipulation"
                      title={`Remove ${film.title}`}
                    >
                      <div className="relative w-12 h-[72px] sm:w-14 sm:h-[84px] rounded-lg overflow-hidden shadow-md ring-2 ring-cinema-500">
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
                    </motion.button>
                  ))}
                  <span className="text-xs text-muted-foreground/60 font-medium">{selected.length}/5</span>
                </div>
              )}

              {/* Suggestions grid */}
              <div>
                <p className="text-xs font-medium text-muted-foreground/50 mb-3 uppercase tracking-wide flex items-center gap-1.5">
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
                          'relative rounded-lg overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cinema-500 touch-manipulation',
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
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-cinema-500/70 flex items-center justify-center"
                            >
                              <Check className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                            </motion.div>
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
              transition={slideTransition}
              className="space-y-6"
            >
              {/* Header */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-cinema-400">
                  Step 3 of 3
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  What genres do you love?
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Pick your favourites — we'll use these to personalise your recommendations.
                </p>
              </div>

              {/* Genre grid — backdrop image cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id)
                  const backdrop = genreBackdrops[genre.id]
                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={cn(
                        'relative h-[100px] sm:h-[120px] rounded-xl overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cinema-500 touch-manipulation active:scale-[0.97]',
                        isSelected
                          ? 'ring-2 ring-cinema-400 shadow-[0_0_12px_-3px_rgba(16,185,129,0.4)]'
                          : 'ring-1 ring-white/[0.08] hover:ring-white/[0.16]'
                      )}
                    >
                      {/* Backdrop image */}
                      {backdrop ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w780${backdrop}`}
                          alt={genre.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                      )}

                      {/* Gradient overlay */}
                      <div className={cn(
                        'absolute inset-0 transition-colors duration-200',
                        isSelected
                          ? 'bg-cinema-900/70'
                          : 'bg-gradient-to-t from-black/80 via-black/40 to-black/20'
                      )} />

                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center gap-1">
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="h-6 w-6 rounded-full bg-cinema-400 flex items-center justify-center mb-0.5"
                          >
                            <Check className="h-3.5 w-3.5 text-black" />
                          </motion.div>
                        )}
                        <span className={cn(
                          'text-sm font-semibold tracking-wide',
                          isSelected ? 'text-cinema-300' : 'text-white'
                        )}>
                          {genre.name}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom action bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-[60] bg-background/95 backdrop-blur-xl border-t border-white/[0.04]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
          {step === 1 ? (
            <>
              <Button
                variant="cinema"
                size="lg"
                onClick={() => goToStep(2)}
                className="w-full gap-2 text-base"
              >
                {importDone ? 'Next' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={() => goToStep(2)}
                className="block w-full text-center text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
              >
                Skip this step
              </button>
            </>
          ) : step === 2 ? (
            <>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => goToStep(1)}
                  className="text-muted-foreground gap-1 px-3 shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="cinema"
                  size="lg"
                  onClick={() => goToStep(3)}
                  className="flex-1 gap-2 text-base"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <button
                onClick={() => goToStep(3)}
                className="block w-full text-center text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
              >
                Skip this step
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => goToStep(2)}
                  className="text-muted-foreground gap-1 px-3 shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="cinema"
                  size="lg"
                  onClick={() => handleFinish(false)}
                  disabled={saving}
                  className="flex-1 text-base"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Get started'
                  )}
                </Button>
              </div>
              <button
                onClick={() => handleFinish(selectedGenres.length === 0 && selected.length === 0)}
                disabled={saving}
                className="block w-full text-center text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1 disabled:opacity-50"
              >
                Skip this step
              </button>
            </>
          )}
        </div>
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
