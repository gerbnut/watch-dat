'use client'

import { motion } from 'framer-motion'
import { AnimatedCounter } from '../AnimatedCounter'

interface TotalFilmsSlideProps {
  totalFilms: number
  percentile: number
}

export function TotalFilmsSlide({ totalFilms, percentile }: TotalFilmsSlideProps) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-cinema-950 via-black to-cinema-950">
      <div className="relative z-10 text-center px-8 space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-sm uppercase tracking-widest"
        >
          You&rsquo;ve watched
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatedCounter
            value={totalFilms}
            className="text-7xl sm:text-9xl font-black tracking-tighter text-cinema-400"
            duration={2}
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-2xl sm:text-3xl font-bold"
        >
          film{totalFilms !== 1 ? 's' : ''}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="inline-block rounded-full bg-cinema-500/20 border border-cinema-500/30 px-4 py-2"
        >
          <span className="text-cinema-400 font-bold text-sm">
            Top {percentile}% of watchers
          </span>
        </motion.div>
      </div>
    </div>
  )
}
