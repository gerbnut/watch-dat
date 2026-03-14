'use client'

import { motion } from 'framer-motion'
import { SlideBackdrop } from '../SlideBackdrop'
import type { MovieSlim } from '@/lib/wrapped'

interface MostSleptOnSlideProps {
  movie: MovieSlim
  userRating: number
  avgRating: number
}

export function MostSleptOnSlide({ movie, userRating, avgRating }: MostSleptOnSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-end pb-24">
      <SlideBackdrop backdrop={movie.backdrop} gradient="from-purple-950/40 via-black/50 to-black/95" />
      <div className="relative z-10 text-center px-8 space-y-5 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-purple-400 text-xs uppercase tracking-widest"
        >
          Most slept on
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-6"
        >
          <div className="text-center">
            <p className="text-3xl font-black text-cinema-400">{userRating.toFixed(1)}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Your rating</p>
          </div>
          <div className="text-white/30 text-lg">vs</div>
          <div className="text-center">
            <p className="text-3xl font-black text-white/40">{avgRating.toFixed(1)}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Average</p>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-purple-400/80 text-sm"
        >
          You saw the brilliance everyone else missed
        </motion.p>
      </div>
    </div>
  )
}
