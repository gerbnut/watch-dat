'use client'

import { motion } from 'framer-motion'

interface OscarSlideProps {
  watched: number
  total: number
  titles: string[]
}

export function OscarSlide({ watched, total, titles }: OscarSlideProps) {
  const percentage = total > 0 ? Math.round((watched / total) * 100) : 0
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-yellow-950/30 via-black to-black">
      <div className="relative z-10 text-center px-8 space-y-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-yellow-500/80 text-xs uppercase tracking-widest"
        >
          Best Picture Winners (Last Decade)
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative inline-flex items-center justify-center"
        >
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <motion.circle
              cx="70" cy="70" r="45" fill="none" stroke="#eab308" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <span className="absolute text-3xl font-black text-yellow-500">{percentage}%</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-xl font-bold"
        >
          {watched} of {total} winners watched
        </motion.p>

        {titles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="space-y-1"
          >
            {titles.map(title => (
              <p key={title} className="text-white/50 text-xs">{title}</p>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
