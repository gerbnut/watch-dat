'use client'

import { motion } from 'framer-motion'

interface TopGenreSlideProps {
  name: string
  count: number
  total: number
}

export function TopGenreSlide({ name, count, total }: TopGenreSlideProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-cinema-950/50 via-black to-cinema-950/30">
      <div className="relative z-10 text-center px-8 space-y-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest"
        >
          Your #1 genre
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl font-black tracking-tight text-cinema-400"
          style={{ textShadow: '0 0 60px rgba(74, 222, 128, 0.3)' }}
        >
          {name}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-1"
        >
          <p className="text-2xl font-bold">
            {count} film{count !== 1 ? 's' : ''}
          </p>
          <p className="text-white/50 text-sm">{percentage}% of your watches</p>
        </motion.div>
      </div>
    </div>
  )
}
