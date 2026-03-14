'use client'

import { motion } from 'framer-motion'

interface DayOfWeekSlideProps {
  dayOfWeek: { day: number; label: string; count: number }[]
}

export function DayOfWeekSlide({ dayOfWeek }: DayOfWeekSlideProps) {
  const maxCount = Math.max(...dayOfWeek.map(d => d.count), 1)
  const peakDay = dayOfWeek.reduce((a, b) => (a.count >= b.count ? a : b))

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-cinema-950/50 via-black to-black">
      <div className="relative z-10 text-center px-8 space-y-8 w-full max-w-sm">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-xs uppercase tracking-widest"
        >
          Your movie nights
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-bold"
        >
          <span className="text-cinema-400">{peakDay.label}</span> is your go-to
        </motion.p>

        <div className="flex items-end justify-center gap-3 h-40">
          {dayOfWeek.map((day, i) => {
            const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0
            const isPeak = day.day === peakDay.day
            return (
              <motion.div
                key={day.day}
                className="flex flex-col items-center gap-2 flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                <span className="text-[10px] text-white/50 tabular-nums">{day.count}</span>
                <motion.div
                  className={`w-full rounded-t-md min-h-[4px] ${isPeak ? 'bg-cinema-400' : 'bg-cinema-500/40'}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPercent, 3)}%` }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                />
                <span className={`text-xs font-medium ${isPeak ? 'text-cinema-400' : 'text-white/50'}`}>
                  {day.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
