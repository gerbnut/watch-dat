'use client'

import { motion } from 'framer-motion'
import { SlideBackdrop } from '../SlideBackdrop'
import type { MovieSlim } from '@/lib/wrapped'

interface HottestTakeSlideProps {
  movie: MovieSlim
  userRating: number
  avgRating: number
}

export function HottestTakeSlide({ movie, userRating, avgRating }: HottestTakeSlideProps) {
  const userLikedMore = userRating > avgRating

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-end pb-24">
      <SlideBackdrop backdrop={movie.backdrop} gradient="from-orange-950/40 via-black/50 to-black/95" />
      <div className="relative z-10 text-center px-8 space-y-5 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-orange-400 text-xs uppercase tracking-widest"
        >
          Your hottest take
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
            <p className="text-[10px] text-white/50 uppercase tracking-wide">You</p>
          </div>
          <div className="text-white/30 text-lg">vs</div>
          <div className="text-center">
            <p className="text-3xl font-black text-white/60">{avgRating.toFixed(1)}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wide">Everyone</p>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-orange-400/80 text-sm"
        >
          {userLikedMore
            ? 'You loved what others didn\'t'
            : 'You weren\'t buying the hype'}
        </motion.p>
      </div>
    </div>
  )
}
