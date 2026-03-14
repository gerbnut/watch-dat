'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { IntroSlide } from './slides/IntroSlide'
import { TotalFilmsSlide } from './slides/TotalFilmsSlide'
import { WatchTimeSlide } from './slides/WatchTimeSlide'
import { HighestBudgetSlide } from './slides/HighestBudgetSlide'
import { OscarSlide } from './slides/OscarSlide'
import { DayOfWeekSlide } from './slides/DayOfWeekSlide'
import { HottestTakeSlide } from './slides/HottestTakeSlide'
import { MostSleptOnSlide } from './slides/MostSleptOnSlide'
import { TopCountriesSlide } from './slides/TopCountriesSlide'
import { LowestBudgetSlide } from './slides/LowestBudgetSlide'
import { HiddenGemSlide } from './slides/HiddenGemSlide'
import { TopGenreSlide } from './slides/TopGenreSlide'
import { TopCastSlide } from './slides/TopCastSlide'
import { MoodboardSlide } from './slides/MoodboardSlide'
import { FriendCompatibilitySlide } from './slides/FriendCompatibilitySlide'
import { ArchetypeSlide } from './slides/ArchetypeSlide'
import { ShareCardSlide } from './slides/ShareCardSlide'
import type { WrappedData } from '@/lib/wrapped'

// ── Slide transition variants ────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

// ── Component ────────────────────────────────────────────────────────────────

interface WrappedClientProps {
  data: WrappedData
}

export function WrappedClient({ data }: WrappedClientProps) {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)

  // Build dynamic slide array — only include slides with data
  const slides = useMemo(() => {
    const s: { key: string; render: () => React.ReactNode }[] = []

    // 1. Intro
    s.push({
      key: 'intro',
      render: () => (
        <IntroSlide
          displayName={data.user.displayName}
          backdrop={data.moodboard[0]?.backdrop ?? null}
        />
      ),
    })

    // 2. Total films
    s.push({
      key: 'total-films',
      render: () => <TotalFilmsSlide totalFilms={data.totalFilms} percentile={data.percentile} />,
    })

    // 3. Watch time
    s.push({
      key: 'watch-time',
      render: () => <WatchTimeSlide totalMinutes={data.totalMinutes} funComparison={data.funComparison} />,
    })

    // 4. Highest budget
    if (data.highestBudget) {
      s.push({
        key: 'highest-budget',
        render: () => <HighestBudgetSlide movie={data.highestBudget!.movie} budget={data.highestBudget!.budget} />,
      })
    }

    // 5. Oscars
    s.push({
      key: 'oscars',
      render: () => (
        <OscarSlide
          watched={data.oscarStats.watched}
          total={data.oscarStats.total}
          titles={data.oscarStats.titles}
        />
      ),
    })

    // 6. Day of week
    s.push({
      key: 'day-of-week',
      render: () => <DayOfWeekSlide dayOfWeek={data.dayOfWeek} />,
    })

    // 7. Hottest take
    if (data.hottestTake) {
      s.push({
        key: 'hottest-take',
        render: () => (
          <HottestTakeSlide
            movie={data.hottestTake!.movie}
            userRating={data.hottestTake!.userRating}
            avgRating={data.hottestTake!.avgRating}
          />
        ),
      })
    }

    // 8. Most slept on
    if (data.mostSleptOn) {
      s.push({
        key: 'most-slept-on',
        render: () => (
          <MostSleptOnSlide
            movie={data.mostSleptOn!.movie}
            userRating={data.mostSleptOn!.userRating}
            avgRating={data.mostSleptOn!.avgRating}
          />
        ),
      })
    }

    // 9. Top countries
    if (data.topCountries.length > 0) {
      s.push({
        key: 'top-countries',
        render: () => <TopCountriesSlide topCountries={data.topCountries} />,
      })
    }

    // 10. Lowest budget
    if (data.lowestBudget) {
      s.push({
        key: 'lowest-budget',
        render: () => <LowestBudgetSlide movie={data.lowestBudget!.movie} budget={data.lowestBudget!.budget} />,
      })
    }

    // 11. Hidden gem
    if (data.hiddenGem) {
      s.push({
        key: 'hidden-gem',
        render: () => <HiddenGemSlide movie={data.hiddenGem!.movie} watcherCount={data.hiddenGem!.watcherCount} />,
      })
    }

    // 12. Top genre
    if (data.topGenre) {
      s.push({
        key: 'top-genre',
        render: () => (
          <TopGenreSlide name={data.topGenre!.name} count={data.topGenre!.count} total={data.topGenre!.total} />
        ),
      })
    }

    // 13. Top cast
    if (data.topCast.length > 0) {
      s.push({
        key: 'top-cast',
        render: () => <TopCastSlide topCast={data.topCast} />,
      })
    }

    // 14. Moodboard
    if (data.moodboard.length >= 3) {
      s.push({
        key: 'moodboard',
        render: () => <MoodboardSlide moodboard={data.moodboard} />,
      })
    }

    // 15. Friend compatibility
    if (data.friendCompatibility) {
      s.push({
        key: 'friend-compatibility',
        render: () => (
          <FriendCompatibilitySlide
            friend={data.friendCompatibility!.user}
            overlapPercent={data.friendCompatibility!.overlapPercent}
            sharedCount={data.friendCompatibility!.sharedCount}
            sharedPosters={data.friendCompatibility!.sharedPosters}
          />
        ),
      })
    }

    // 16. Archetype
    s.push({
      key: 'archetype',
      render: () => <ArchetypeSlide label={data.archetype.label} description={data.archetype.description} />,
    })

    // 17. Share card
    s.push({
      key: 'share-card',
      render: () => (
        <ShareCardSlide
          username={data.user.username}
          displayName={data.user.displayName}
          totalFilms={data.totalFilms}
          totalHours={Math.floor(data.totalMinutes / 60)}
          topGenre={data.topGenre?.name ?? null}
          archetype={data.archetype.label}
          moodboard={data.moodboard}
        />
      ),
    })

    return s
  }, [data])

  const totalSlides = slides.length

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setDirection(1)
      setCurrentSlide(prev => prev + 1)
    }
  }, [currentSlide, totalSlides])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide(prev => prev - 1)
    }
  }, [currentSlide])

  const handleClose = useCallback(() => {
    router.push(`/user/${data.user.username}`)
  }, [router, data.user.username])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, handleClose])

  // Tap zones
  function handleTap(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const threshold = rect.width * 0.3
    if (x < threshold) {
      goPrev()
    } else {
      goNext()
    }
  }

  // Swipe
  function handlePanEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -50 || info.velocity.x < -300) {
      goNext()
    } else if (info.offset.x > 50 || info.velocity.x > 300) {
      goPrev()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white select-none overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-2 pb-1 px-1 safe-top">
        <ProgressBar total={totalSlides} current={currentSlide} />
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors safe-top"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Slide content */}
      <motion.div
        className="h-full w-full cursor-pointer"
        onClick={handleTap}
        onPanEnd={handlePanEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slides[currentSlide].key}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="h-full w-full"
          >
            {slides[currentSlide].render()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Slide counter */}
      <div className="absolute bottom-4 left-0 right-0 z-20 text-center">
        <span className="text-[10px] text-white/30 tabular-nums">
          {currentSlide + 1} / {totalSlides}
        </span>
      </div>
    </div>
  )
}
