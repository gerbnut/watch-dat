'use client'

import { motion } from 'framer-motion'
import { SlideBackdrop } from '../SlideBackdrop'
import type { MovieSlim } from '@/lib/wrapped'

interface LowestBudgetSlideProps {
  movie: MovieSlim
  budget: number
}

function formatBudget(budget: number): string {
  if (budget >= 1_000_000) return `$${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 1_000) return `$${Math.round(budget / 1_000).toLocaleString()}K`
  return `$${budget.toLocaleString()}`
}

export function LowestBudgetSlide({ movie, budget }: LowestBudgetSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-end pb-24">
      <SlideBackdrop backdrop={movie.backdrop} gradient="from-black/40 via-black/40 to-black/95" />
      <div className="relative z-10 text-center px-8 space-y-4 max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest"
        >
          Your indie cred
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
          className="inline-block rounded-full bg-white/[0.08] border border-white/[0.1] px-5 py-2"
        >
          <span className="text-white font-black text-xl">{formatBudget(budget)}</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-white/50 text-sm"
        >
          The lowest-budget film in your collection
        </motion.p>
      </div>
    </div>
  )
}
