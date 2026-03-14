'use client'

import { motion } from 'framer-motion'
import { SlideBackdrop } from '../SlideBackdrop'
import type { MovieSlim } from '@/lib/wrapped'

interface HighestBudgetSlideProps {
  movie: MovieSlim
  budget: number
}

function formatBudget(budget: number): string {
  if (budget >= 1_000_000_000) return `$${(budget / 1_000_000_000).toFixed(1)}B`
  if (budget >= 1_000_000) return `$${Math.round(budget / 1_000_000)}M`
  if (budget >= 1_000) return `$${Math.round(budget / 1_000)}K`
  return `$${budget.toLocaleString()}`
}

export function HighestBudgetSlide({ movie, budget }: HighestBudgetSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-end pb-24">
      <SlideBackdrop backdrop={movie.backdrop} gradient="from-black/40 via-black/30 to-black/95" />
      <div className="relative z-10 text-center px-8 space-y-4 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest"
        >
          Biggest budget you&rsquo;ve watched
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl sm:text-4xl font-black tracking-tight"
        >
          {movie.title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="inline-block rounded-full bg-cinema-500/20 border border-cinema-500/30 px-5 py-2"
        >
          <span className="text-cinema-400 font-black text-2xl">{formatBudget(budget)}</span>
        </motion.div>
      </div>
    </div>
  )
}
