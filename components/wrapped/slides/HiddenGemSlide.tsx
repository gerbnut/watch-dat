'use client'

import { motion } from 'framer-motion'
import { SlideBackdrop } from '../SlideBackdrop'
import type { MovieSlim } from '@/lib/wrapped'

interface HiddenGemSlideProps {
  movie: MovieSlim
  watcherCount: number
}

export function HiddenGemSlide({ movie, watcherCount }: HiddenGemSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-end pb-24">
      <SlideBackdrop backdrop={movie.backdrop} gradient="from-emerald-950/30 via-black/50 to-black/95" />
      <div className="relative z-10 text-center px-8 space-y-5 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-emerald-400 text-xs uppercase tracking-widest"
        >
          Hidden gem
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl sm:text-3xl font-black tracking-tight"
        >
          {movie.title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="inline-block rounded-xl bg-emerald-500/15 border border-emerald-500/25 px-5 py-3"
        >
          <p className="text-emerald-400 font-bold text-sm">
            Only {watcherCount} {watcherCount === 1 ? 'person' : 'people'} on Watch Dat watched this
          </p>
        </motion.div>
      </div>
    </div>
  )
}
