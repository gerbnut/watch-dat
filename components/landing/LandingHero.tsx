'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Film } from 'lucide-react'
import { CINEMATIC_BACKDROPS } from '@/lib/cinematic-backdrops'
import { TMDB_IMAGE } from '@/lib/tmdb'
import { WatchDatLogoMark } from '@/components/layout/WatchDatLogo'
import { Button } from '@/components/ui/button'

export function LandingHero() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % CINEMATIC_BACKDROPS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const current = CINEMATIC_BACKDROPS[index]

  return (
    <section className="relative overflow-hidden rounded-3xl h-[70vh] min-h-[500px] max-h-[700px]">
      {/* Rotating backdrops */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current.path}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TMDB_IMAGE.backdrop(current.path, 'w1280')!}
            alt={current.title}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5 sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cinema-500/15 border border-cinema-500/20 px-4 py-1.5 text-sm text-cinema-300 mb-6">
          <WatchDatLogoMark className="text-cinema-400" size={16} />
          Watch Dat
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
          Your film diary,<br />
          <span className="text-cinema-400">your way.</span>
        </h1>

        <p className="text-sm sm:text-lg text-white/70 max-w-xl mx-auto mb-8">
          Log what you watch. Share what you love.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/register">
            <Button variant="cinema" size="lg" className="sm:!h-12 sm:!px-8 sm:!text-base shadow-glow-green-sm">
              Start your diary
            </Button>
          </Link>
          <Link href="/films">
            <Button variant="glass" size="lg" className="sm:!h-12 sm:!px-8 sm:!text-base">
              Explore films
            </Button>
          </Link>
        </div>
      </div>

      {/* Film attribution */}
      <div className="absolute bottom-3 right-4 z-10 text-[10px] text-white/30">
        {current.title}
      </div>
    </section>
  )
}
