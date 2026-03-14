'use client'

import { motion } from 'framer-motion'
import { AnimatedCounter } from '../AnimatedCounter'

interface WatchTimeSlideProps {
  totalMinutes: number
  funComparison: string
}

export function WatchTimeSlide({ totalMinutes, funComparison }: WatchTimeSlideProps) {
  const hours = Math.floor(totalMinutes / 60)
  const days = Math.floor(hours / 24)

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-cinema-950 via-black to-cinema-950/80">
      <div className="relative z-10 text-center px-8 space-y-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-sm uppercase tracking-widest"
        >
          Total screen time
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          <div className="flex items-baseline justify-center gap-3">
            <AnimatedCounter
              value={hours}
              className="text-6xl sm:text-8xl font-black tracking-tighter text-white"
              duration={2}
            />
            <span className="text-2xl text-white/60 font-medium">hours</span>
          </div>
          {days >= 1 && (
            <p className="text-white/40 text-sm">
              {totalMinutes.toLocaleString()} minutes / {days} full day{days !== 1 ? 's' : ''}
            </p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="rounded-xl bg-white/[0.05] border border-white/[0.08] px-5 py-3 max-w-xs mx-auto"
        >
          <p className="text-cinema-400 text-sm font-medium">{funComparison}</p>
        </motion.div>
      </div>
    </div>
  )
}
